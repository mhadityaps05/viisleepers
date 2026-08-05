import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendReturnRequestConfirmationEmail } from "@/lib/return-request-email"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

export async function POST(request) {
  try {
    const body = await request.json()
    const email = normalizeEmail(body?.email)
    const orderNumber =
      typeof body?.orderNumber === "string" ? body.orderNumber.trim() : ""
    const orderItems =
      typeof body?.orderItems === "string" ? body.orderItems.trim() : ""

    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { success: false, message: "A valid email is required." },
        { status: 400 },
      )
    }

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, message: "Order number is required." },
        { status: 400 },
      )
    }

    if (!orderItems) {
      return NextResponse.json(
        { success: false, message: "Order items are required." },
        { status: 400 },
      )
    }

    const returnRequest = await prisma.returnRequest.create({
      data: {
        email,
        orderNumber,
        orderItems,
      },
      select: {
        id: true,
        email: true,
        orderNumber: true,
        orderItems: true,
        status: true,
        createdAt: true,
      },
    })

    let emailMessage = ""

    try {
      const emailResult = await sendReturnRequestConfirmationEmail({
        email: returnRequest.email,
        orderNumber: returnRequest.orderNumber,
        orderItems: returnRequest.orderItems,
        status: returnRequest.status,
        createdAt: returnRequest.createdAt,
      })

      if (!emailResult.sent && emailResult.reason) {
        emailMessage = ` Return request saved, but email not sent: ${emailResult.reason}`
      }
    } catch (emailError) {
      const message =
        emailError instanceof Error
          ? emailError.message
          : "Unknown email error."
      emailMessage = ` Return request saved, but email failed: ${message}`
    }

    return NextResponse.json(
      {
        success: true,
        message: `Return request submitted successfully.${emailMessage}`,
        returnRequest,
      },
      { status: 201 },
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to submit return request."

    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
