import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendReturnStatusUpdateEmail } from "@/lib/return-request-email"

const ALLOWED_RETURN_STATUSES = new Set([
  "Pending",
  "Approved",
  "Rejected",
  "Completed",
])

export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const status = typeof body?.status === "string" ? body.status.trim() : ""

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Return request id is required." },
        { status: 400 },
      )
    }

    if (!ALLOWED_RETURN_STATUSES.has(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid return status value." },
        { status: 400 },
      )
    }

    const existingRequest = await prisma.returnRequest.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        orderNumber: true,
        orderItems: true,
        status: true,
        createdAt: true,
      },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, message: "Return request not found." },
        { status: 404 },
      )
    }

    const updatedRequest = await prisma.returnRequest.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        orderNumber: true,
        orderItems: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (existingRequest.status !== updatedRequest.status) {
      try {
        const emailResult = await sendReturnStatusUpdateEmail({
          email: updatedRequest.email,
          orderNumber: updatedRequest.orderNumber,
          orderItems: updatedRequest.orderItems,
          status: updatedRequest.status,
          createdAt: updatedRequest.createdAt,
        })

        if (!emailResult.sent && emailResult.reason) {
          return NextResponse.json(
            {
              success: true,
              returnRequest: updatedRequest,
              message: `Status updated, but email was not sent: ${emailResult.reason}`,
            },
            { status: 200 },
          )
        }
      } catch (emailError) {
        const message =
          emailError instanceof Error
            ? emailError.message
            : "Unknown email delivery error."

        return NextResponse.json(
          {
            success: true,
            returnRequest: updatedRequest,
            message: `Status updated, but email failed to send: ${message}`,
          },
          { status: 200 },
        )
      }
    }

    return NextResponse.json({ success: true, returnRequest: updatedRequest })
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update return request status." },
      { status: 500 },
    )
  }
}
