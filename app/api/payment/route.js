import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { snap } from "@/lib/midtrans"
import {
  buildOrderNumberFromAttemptId,
  isValidCheckoutAttemptId,
} from "@/lib/checkout-payment"

export const runtime = "nodejs"

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0
}

function sanitizeOrderItems(items) {
  if (!Array.isArray(items)) {
    return null
  }

  const sanitized = items
    .map((item) => ({
      productId:
        typeof item?.productId === "string" ? item.productId.trim() : "",
      quantity: Number(item?.quantity),
      size: typeof item?.size === "string" ? item.size.trim() : "",
      price: Number(item?.price),
      name: typeof item?.name === "string" ? item.name.trim() : "",
    }))
    .filter(
      (item) =>
        isNonEmptyString(item.productId) &&
        isNonEmptyString(item.size) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        Number.isInteger(item.price) &&
        item.price >= 0,
    )

  if (sanitized.length === 0 || sanitized.length !== items.length) {
    return null
  }

  return sanitized
}

function buildSnapItemDetails(cartItems, shippingFee) {
  const productItems = cartItems.map((item) => ({
    id: item.productId,
    price: item.price,
    quantity: item.quantity,
    name: item.name || `Product ${item.productId}`,
  }))

  if (shippingFee > 0) {
    productItems.push({
      id: "SHIPPING",
      price: shippingFee,
      quantity: 1,
      name: "Shipping Fee",
    })
  }

  return productItems
}

async function getStockConflicts(cartItems) {
  const productIds = [...new Set(cartItems.map((item) => item.productId))]

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    select: {
      id: true,
      name: true,
      stock: true,
    },
  })

  const productsById = new Map(products.map((product) => [product.id, product]))

  return cartItems.flatMap((item) => {
    const product = productsById.get(item.productId)
    const availableStock = product?.stock ?? 0

    if (availableStock >= item.quantity) {
      return []
    }

    return [
      {
        productId: item.productId,
        productName: product?.name || item.name || "Unavailable Product",
        availableStock,
        requestedQuantity: item.quantity,
      },
    ]
  })
}

export async function POST(request) {
  try {
    // 1) Read and normalize incoming checkout payload.
    const body = await request.json()
    const attemptId =
      typeof body?.attemptId === "string" ? body.attemptId.trim() : ""

    const customerInformation = body?.customerInformation ?? {}
    const shippingAddress = body?.shippingAddress ?? {}
    const totals = body?.totals ?? {}
    const cartItems = sanitizeOrderItems(body?.cartItems)

    const customerName = customerInformation?.name
    const email = customerInformation?.email
    const phone = customerInformation?.phoneNumber

    const province = shippingAddress?.provinceState
    const city = shippingAddress?.city
    const postalCode = shippingAddress?.postalCode
    const address = shippingAddress?.fullAddress

    const subtotal = Number(totals?.subtotal)
    const shippingFee = Number(totals?.shippingFee)
    const total = Number(totals?.total)

    if (!isValidCheckoutAttemptId(attemptId)) {
      return NextResponse.json(
        { message: "Invalid checkout attempt." },
        { status: 400 },
      )
    }

    if (
      !isNonEmptyString(customerName) ||
      !isNonEmptyString(email) ||
      !isNonEmptyString(phone) ||
      !isNonEmptyString(province) ||
      !isNonEmptyString(city) ||
      !isNonEmptyString(postalCode) ||
      !isNonEmptyString(address)
    ) {
      return NextResponse.json(
        { message: "Incomplete customer or shipping information." },
        { status: 400 },
      )
    }

    if (!cartItems) {
      return NextResponse.json(
        { message: "Cart items are invalid." },
        { status: 400 },
      )
    }

    if (
      !isNonNegativeInteger(subtotal) ||
      !isNonNegativeInteger(shippingFee) ||
      !isNonNegativeInteger(total)
    ) {
      return NextResponse.json(
        { message: "Totals must be non-negative integers." },
        { status: 400 },
      )
    }

    const computedSubtotal = cartItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    )

    if (computedSubtotal !== subtotal || subtotal + shippingFee !== total) {
      return NextResponse.json(
        { message: "Order totals do not match cart data." },
        { status: 400 },
      )
    }

    // 2) Derive a deterministic order number so refreshes and retries reuse the same order.
    const orderNumber = buildOrderNumberFromAttemptId(attemptId)

    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        customerName: true,
        email: true,
        phone: true,
        province: true,
        city: true,
        postalCode: true,
        address: true,
        subtotal: true,
        shippingFee: true,
        total: true,
        paymentSessionStatus: true,
        midtransToken: true,
        midtransRedirectUrl: true,
        orderItems: {
          select: {
            productId: true,
            quantity: true,
            size: true,
            priceAtPurchase: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (existingOrder?.midtransRedirectUrl && existingOrder?.midtransToken) {
      return NextResponse.json(
        {
          token: existingOrder.midtransToken,
          redirect_url: existingOrder.midtransRedirectUrl,
        },
        { status: 200 },
      )
    }

    if (existingOrder) {
      const hasSameCustomerData =
        existingOrder.customerName === customerName.trim() &&
        existingOrder.email === email.trim() &&
        existingOrder.phone === phone.trim() &&
        existingOrder.province === province.trim() &&
        existingOrder.city === city.trim() &&
        existingOrder.postalCode === postalCode.trim() &&
        existingOrder.address === address.trim() &&
        existingOrder.subtotal === subtotal &&
        existingOrder.shippingFee === shippingFee &&
        existingOrder.total === total

      const hasSameItems =
        existingOrder.orderItems.length === cartItems.length &&
        existingOrder.orderItems.every((item, index) => {
          const candidate = cartItems[index]

          return (
            item.productId === candidate.productId &&
            item.quantity === candidate.quantity &&
            item.size === candidate.size &&
            item.priceAtPurchase === candidate.price
          )
        })

      if (!hasSameCustomerData || !hasSameItems) {
        return NextResponse.json(
          {
            message:
              "This payment session no longer matches your checkout details. Please return to checkout and try again.",
          },
          { status: 409 },
        )
      }

      if (existingOrder.paymentSessionStatus === "PREPARING") {
        return NextResponse.json(
          { message: "Payment session is still being prepared." },
          { status: 202 },
        )
      }
    }

    const stockConflicts = await getStockConflicts(cartItems)

    if (stockConflicts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Some products are no longer available in the requested quantity.",
          items: stockConflicts,
        },
        { status: 409 },
      )
    }

    let orderRecord = existingOrder

    if (!orderRecord) {
      orderRecord = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber,
            customerName: customerName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            province: province.trim(),
            city: city.trim(),
            postalCode: postalCode.trim(),
            address: address.trim(),
            subtotal,
            shippingFee,
            total,
            status: "Pending",
            paymentSessionStatus: "PREPARING",
          },
          select: {
            id: true,
            orderNumber: true,
          },
        })

        await tx.orderItem.createMany({
          data: cartItems.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            priceAtPurchase: item.price,
          })),
        })

        return order
      })
    } else {
      const preparingOrder = await prisma.order.updateMany({
        where: {
          orderNumber,
          paymentSessionStatus: {
            in: ["NOT_STARTED", "FAILED"],
          },
        },
        data: {
          paymentSessionStatus: "PREPARING",
        },
      })

      if (preparingOrder.count === 0) {
        return NextResponse.json(
          { message: "Payment session is still being prepared." },
          { status: 202 },
        )
      }
    }

    try {
      // 3) Request Snap token from Midtrans using trusted server credentials.
      const transaction = await snap.createTransaction({
        transaction_details: {
          order_id: orderNumber,
          gross_amount: total,
        },
        item_details: buildSnapItemDetails(cartItems, shippingFee),
        customer_details: {
          first_name: customerName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          billing_address: {
            first_name: customerName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            postal_code: postalCode.trim(),
            country_code: "IDN",
          },
          shipping_address: {
            first_name: customerName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            postal_code: postalCode.trim(),
            country_code: "IDN",
          },
        },
      })

      await prisma.order.update({
        where: { orderNumber },
        data: {
          paymentSessionStatus: "READY",
          midtransToken: transaction.token,
          midtransRedirectUrl: transaction.redirect_url,
        },
      })

      return NextResponse.json(
        {
          token: transaction.token,
          redirect_url: transaction.redirect_url,
        },
        { status: existingOrder ? 200 : 201 },
      )
    } catch (error) {
      await prisma.order.update({
        where: { orderNumber },
        data: {
          paymentSessionStatus: "FAILED",
        },
      })

      throw error
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to initialize payment."

    return NextResponse.json({ message }, { status: 500 })
  }
}
