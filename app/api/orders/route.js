import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const PAGE_SIZE = 10

const PAYMENT_STATUSES = new Set([
  "Pending",
  "Paid",
  "Failed",
  "Expired",
  "Cancelled",
  "Refunded",
])

const ORDER_STATUSES = new Set([
  "Pending",
  "Processing",
  "Shipping",
  "Delivered",
  "Cancelled",
])

const SORT_OPTIONS = new Set(["newest", "oldest"])

function toPositiveInt(value, fallback = 1) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

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

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams

    const q = String(searchParams.get("q") || "").trim()
    const payment = String(searchParams.get("payment") || "All").trim()
    const order = String(searchParams.get("order") || "All").trim()
    const sort = String(searchParams.get("sort") || "newest").trim()
    const requestedPage = toPositiveInt(searchParams.get("page"), 1)

    const normalizedPayment = PAYMENT_STATUSES.has(payment) ? payment : "All"
    const normalizedOrder = ORDER_STATUSES.has(order) ? order : "All"
    const normalizedSort = SORT_OPTIONS.has(sort) ? sort : "newest"

    const whereClauses = []

    if (q) {
      whereClauses.push({
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" } },
          { customerName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      })
    }

    if (normalizedPayment !== "All") {
      whereClauses.push({ status: normalizedPayment })
    }

    if (normalizedOrder !== "All") {
      whereClauses.push({ orderStatus: normalizedOrder })
    }

    const where = whereClauses.length > 0 ? { AND: whereClauses } : {}
    const totalCount = await prisma.order.count({ where })
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
    const currentPage = Math.min(requestedPage, totalPages)

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: normalizedSort === "oldest" ? "asc" : "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
        orderStatus: true,
        createdAt: true,
      },
    })

    const startItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
    const endItem = totalCount === 0 ? 0 : startItem + orders.length - 1

    return NextResponse.json(
      {
        orders,
        meta: {
          totalCount,
          totalPages,
          currentPage,
          startItem,
          endItem,
          pageSize: PAGE_SIZE,
          filters: {
            q,
            payment: normalizedPayment,
            order: normalizedOrder,
            sort: normalizedSort,
          },
        },
      },
      { status: 200 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch orders."

    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
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

    const orderNumber = await generateUniqueOrderNumber()

    const createdOrder = await prisma.$transaction(async (tx) => {
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

      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          orderItems: true,
        },
      })
    })

    return NextResponse.json({ order: createdOrder }, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create order."
    return NextResponse.json({ message }, { status: 500 })
  }
}
