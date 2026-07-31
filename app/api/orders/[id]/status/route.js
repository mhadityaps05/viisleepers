import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendOrderStatusEmail } from "@/lib/order-status-email"

const ALLOWED_STATUSES = new Set([
  "Pending",
  "Processing",
  "Shipping",
  "Delivered",
  "Cancelled",
])

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const orderStatus =
      typeof body?.orderStatus === "string" ? body.orderStatus.trim() : ""
    const courier = typeof body?.courier === "string" ? body.courier.trim() : ""
    const trackingNumber =
      typeof body?.trackingNumber === "string" ? body.trackingNumber.trim() : ""

    if (!id) {
      return NextResponse.json(
        { message: "Order id is required." },
        { status: 400 },
      )
    }

    if (!ALLOWED_STATUSES.has(orderStatus)) {
      return NextResponse.json(
        { message: "Invalid order status value." },
        { status: 400 },
      )
    }

    if (orderStatus === "Shipping" && (!courier || !trackingNumber)) {
      return NextResponse.json(
        { message: "Courier and tracking number are required for Shipping." },
        { status: 400 },
      )
    }

    const updateData = {
      orderStatus,
      courier: orderStatus === "Shipping" ? courier : null,
      trackingNumber: orderStatus === "Shipping" ? trackingNumber : null,
    }

    const previousOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        customerName: true,
        email: true,
        orderNumber: true,
        orderStatus: true,
      },
    })

    if (!previousOrder) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 })
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        email: true,
        total: true,
        createdAt: true,
        status: true,
        orderStatus: true,
        courier: true,
        trackingNumber: true,
        orderItems: {
          select: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
        updatedAt: true,
      },
    })

    if (previousOrder.orderStatus !== order.orderStatus) {
      const productNames = order.orderItems
        .map((item) => item?.product?.name)
        .filter((name) => typeof name === "string" && name.trim().length > 0)

      try {
        const emailResult = await sendOrderStatusEmail({
          customerEmail: order.email,
          customerName: order.customerName,
          orderNumber: order.orderNumber,
          paymentStatus: order.status,
          orderStatus: order.orderStatus,
          total: order.total,
          createdAt: order.createdAt,
          productNames,
          courier: order.courier,
          trackingNumber: order.trackingNumber,
        })

        if (!emailResult.sent && emailResult.reason) {
          return NextResponse.json(
            {
              order,
              message: `Order status updated, but email was not sent: ${emailResult.reason}`,
            },
            { status: 200 },
          )
        }
      } catch (emailError) {
        const emailMessage =
          emailError instanceof Error
            ? emailError.message
            : "Unknown email delivery error."

        return NextResponse.json(
          {
            order,
            message: `Order status updated, but email failed to send: ${emailMessage}`,
          },
          { status: 200 },
        )
      }
    }

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
