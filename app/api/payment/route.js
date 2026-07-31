import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { snap } from "@/lib/midtrans"

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

async function generateUniqueOrderNumber() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `VSS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

    const existing = await prisma.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    })

    if (!existing) {
      return candidate
    }
  }

  throw new Error("Failed to generate unique order number.")
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

export async function POST(request) {
  try {
    // 1) Read and normalize incoming checkout payload.
    const body = await request.json()

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

    // 2) Generate app order number used as Midtrans order_id.
    const orderNumber = await generateUniqueOrderNumber()

    // Save order before requesting Snap token so webhook can update by order number.
    await prisma.$transaction(async (tx) => {
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
    })

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

    return NextResponse.json(
      {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
      },
      { status: 201 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to initialize payment."

    return NextResponse.json({ message }, { status: 500 })
  }
}
