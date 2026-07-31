import crypto from "node:crypto"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

async function reduceStockForOrder(tx, orderItems) {
  for (const item of orderItems) {
    const updated = await tx.product.updateMany({
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

    if (updated.count !== 1) {
      throw new Error(`Insufficient stock for product ${item.productId}.`)
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
      include: { orderItems: true },
    })

    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 })
    }

    // 2) Update status atomically and reduce stock once when payment is confirmed.
    await prisma.$transaction(async (tx) => {
      const latest = await tx.order.findUnique({
        where: { id: order.id },
        include: { orderItems: true },
      })

      if (!latest) {
        throw new Error("Order not found during transaction update.")
      }

      // Reduce stock only on the first successful payment confirmation.
      const isMovingToPaid =
        nextStatus === "Paid" &&
        !STOCK_ALREADY_REDUCED_STATUSES.has(latest.status)

      if (isMovingToPaid) {
        await reduceStockForOrder(tx, latest.orderItems)
      }

      // Keep order management fields independent; update payment status only.
      await tx.order.update({
        where: { id: latest.id },
        data: { status: nextStatus },
      })
    })

    return NextResponse.json({ message: "Notification processed." })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to process Midtrans notification."

    return NextResponse.json({ message }, { status: 500 })
  }
}
