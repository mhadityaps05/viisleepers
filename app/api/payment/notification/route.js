import crypto from "node:crypto"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  sendAdminPaymentNotificationEmail,
  sendPaymentSuccessEmail,
} from "@/lib/order-status-email"

export const runtime = "nodejs"

const STOCK_ALREADY_REDUCED_STATUSES = new Set([
  "Paid",
  "Refunded",
  "Partially Refunded",
  "Processing",
  "Shipped",
  "Completed",
])

function buildSignature(orderId, statusCode, grossAmount, serverKey) {
  return crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex")
}

function mapMidtransStatus(transactionStatus) {
  if (transactionStatus === "settlement") {
    return "Paid"
  }

  if (transactionStatus === "capture") {
    return "Paid"
  }

  if (transactionStatus === "pending") {
    return "Pending"
  }

  if (transactionStatus === "expire") {
    return "Expired"
  }

  if (transactionStatus === "cancel") {
    return "Cancelled"
  }

  if (transactionStatus === "deny" || transactionStatus === "failure") {
    return "Failed"
  }

  if (transactionStatus === "refund") {
    return "Refunded"
  }

  if (transactionStatus === "partial_refund") {
    return "Partially Refunded"
  }

  return null
}

function normalizeSizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
}

async function reduceStockForOrder(tx, orderItems) {
  const groupedItems = new Map()

  for (const item of orderItems) {
    const key = `${item.productId}::${normalizeSizeValue(item.size)}`
    const existing = groupedItems.get(key)

    if (existing) {
      existing.quantity += item.quantity
    } else {
      groupedItems.set(key, {
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
      })
    }
  }

  const groupedList = Array.from(groupedItems.values())
  const productIds = [...new Set(groupedList.map((item) => item.productId))]

  const productSizeRows = await tx.productSize.findMany({
    where: {
      productId: {
        in: productIds,
      },
    },
    include: {
      size: {
        select: {
          value: true,
        },
      },
    },
  })

  const productSizesByProductId = productSizeRows.reduce((acc, row) => {
    if (!acc.has(row.productId)) {
      acc.set(row.productId, [])
    }

    acc.get(row.productId).push(row)
    return acc
  }, new Map())

  for (const item of groupedList) {
    const sizeRows = productSizesByProductId.get(item.productId) || []

    if (sizeRows.length > 0) {
      const matchedRow = sizeRows.find(
        (row) =>
          normalizeSizeValue(row.size.value) === normalizeSizeValue(item.size),
      )

      if (!matchedRow) {
        throw new Error(
          `Insufficient stock for product ${item.productId} size ${item.size}.`,
        )
      }

      const updatedSizeStock = await tx.productSize.updateMany({
        where: {
          id: matchedRow.id,
          stock: {
            gte: item.quantity,
          },
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })

      if (updatedSizeStock.count !== 1) {
        throw new Error(
          `Insufficient stock for product ${item.productId} size ${item.size}.`,
        )
      }

      continue
    }

    const updatedProductStock = await tx.product.updateMany({
      where: {
        id: item.productId,
        stock: {
          gte: item.quantity,
        },
      },
      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    })

    if (updatedProductStock.count !== 1) {
      throw new Error(
        `Insufficient legacy stock for product ${item.productId}.`,
      )
    }
  }

  for (const productId of productIds) {
    const sizeRows = await tx.productSize.findMany({
      where: { productId },
      select: { stock: true },
    })

    if (sizeRows.length > 0) {
      const totalStock = sizeRows.reduce((sum, row) => sum + row.stock, 0)

      await tx.product.update({
        where: { id: productId },
        data: { stock: totalStock },
      })
    }
  }
}

export async function POST(request) {
  try {
    // 1) Read required secret and parse webhook payload.
    const serverKey = process.env.MIDTRANS_SERVER_KEY

    if (!serverKey) {
      return NextResponse.json(
        { message: "MIDTRANS_SERVER_KEY is not configured." },
        { status: 500 },
      )
    }

    const payload = await request.json()

    const orderId = String(payload?.order_id || "")
    const statusCode = String(payload?.status_code || "")
    const grossAmount = String(payload?.gross_amount || "")
    const signatureKey = String(payload?.signature_key || "")
    const transactionStatus = String(payload?.transaction_status || "")
    const paymentType = String(payload?.payment_type || "")
    const transactionTime = payload?.transaction_time
      ? String(payload.transaction_time)
      : new Date().toISOString()

    if (!orderId || !statusCode || !grossAmount || !signatureKey) {
      return NextResponse.json(
        { message: "Invalid Midtrans notification payload." },
        { status: 400 },
      )
    }

    // Verify Midtrans signature so only trusted callbacks can change order state.
    const expectedSignature = buildSignature(
      orderId,
      statusCode,
      grossAmount,
      serverKey,
    )

    if (signatureKey !== expectedSignature) {
      return NextResponse.json(
        { message: "Invalid Midtrans signature." },
        { status: 401 },
      )
    }

    const nextStatus = mapMidtransStatus(transactionStatus)

    if (!nextStatus) {
      return NextResponse.json(
        { message: `Ignored transaction status: ${transactionStatus}` },
        { status: 200 },
      )
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 })
    }

    // 2) Update status atomically and reduce stock once when payment is confirmed.
    const shouldSendPaymentSuccessEmail = await prisma.$transaction(
      async (tx) => {
        const latest = await tx.order.findUnique({
          where: { id: order.id },
          include: { orderItems: true },
        })

        if (!latest) {
          throw new Error("Order not found during transaction update.")
        }

        if (nextStatus === "Paid") {
          const becamePaid = await tx.order.updateMany({
            where: {
              id: latest.id,
              status: {
                not: "Paid",
              },
            },
            data: { status: "Paid" },
          })

          if (becamePaid.count === 1) {
            await reduceStockForOrder(tx, latest.orderItems)
            return true
          }

          return false
        }

        // Keep order management fields independent; update payment status only.
        await tx.order.update({
          where: { id: latest.id },
          data: { status: nextStatus },
        })

        return false
      },
    )

    // Send only one confirmation email for the first transition to Paid.
    if (shouldSendPaymentSuccessEmail) {
      const productNames = order.orderItems
        .map((item) => item?.product?.name)
        .filter((name) => typeof name === "string" && name.trim().length > 0)

      const totalQuantity = order.orderItems.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
      )

      try {
        await sendPaymentSuccessEmail({
          customerEmail: order.email,
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          productNames,
          quantity: totalQuantity,
          total: order.total,
          createdAt: order.createdAt,
          paymentStatus: "Paid",
          orderStatus: "Pending",
        })
      } catch {
        // Keep webhook idempotent and successful even when email fails.
      }

      // Notify the store owner too. Failure here must never fail the
      // webhook response — a non-200 makes Midtrans retry the whole
      // notification, which would re-run this block unnecessarily.
      try {
        await sendAdminPaymentNotificationEmail({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.email,
          customerPhone: order.phone,
          orderItems: order.orderItems.map((item) => ({
            productName: item.product?.name || "Product",
            size: item.size,
            quantity: item.quantity,
            price: item.priceAtPurchase,
          })),
          total: order.total,
          paymentMethod: paymentType,
          transactionTime,
        })
      } catch (error) {
        console.error("[ADMIN_PAYMENT_NOTIFICATION_EMAIL]", {
          orderNumber: order.orderNumber,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return NextResponse.json({ message: "Notification processed." })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to process Midtrans notification."

    return NextResponse.json({ message }, { status: 500 })
  }
}
