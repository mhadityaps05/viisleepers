import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ALLOWED_STATUSES = new Set([
  "Pending",
  "Paid",
  "Processing",
  "Shipped",
  "Completed",
  "Cancelled",
])

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const status = typeof body?.status === "string" ? body.status.trim() : ""

    if (!id) {
      return NextResponse.json(
        { message: "Order id is required." },
        { status: 400 },
      )
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { message: "Invalid status value." },
        { status: 400 },
      )
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ order }, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update order status."

    if (
      typeof message === "string" &&
      message.toLowerCase().includes("record to update not found")
    ) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 })
    }

    return NextResponse.json(
      { message: "Failed to update order status." },
      { status: 500 },
    )
  }
}
