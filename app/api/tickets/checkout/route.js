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

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0
}

export async function POST(request) {
  try {
    // 1) Read and normalize incoming checkout payload.
    const body = await request.json()
    const attemptId =
      typeof body?.attemptId === "string" ? body.attemptId.trim() : ""

    const buyerName = body?.name
    const buyerEmail = body?.email
    const buyerPhone = body?.phone
    const ticketTypeId =
      typeof body?.ticketTypeId === "string" ? body.ticketTypeId.trim() : ""
    const quantity = Number(body?.quantity)

    if (!isValidCheckoutAttemptId(attemptId)) {
      return NextResponse.json(
        { message: "Invalid checkout attempt." },
        { status: 400 },
      )
    }

    if (
      !isNonEmptyString(buyerName) ||
      !isNonEmptyString(buyerEmail) ||
      !isNonEmptyString(buyerPhone)
    ) {
      return NextResponse.json(
        { message: "Name, email, and phone number are required." },
        { status: 400 },
      )
    }

    if (!isNonEmptyString(ticketTypeId)) {
      return NextResponse.json(
        { message: "Ticket type is required." },
        { status: 400 },
      )
    }

    if (!isPositiveInteger(quantity)) {
      return NextResponse.json(
        { message: "Quantity must be a positive integer." },
        { status: 400 },
      )
    }

    // Price always comes from the database, never from the client payload.
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: {
        event: {
          select: { name: true },
        },
      },
    })

    if (!ticketType || !ticketType.active) {
      return NextResponse.json(
        { message: "Ticket type is not available." },
        { status: 404 },
      )
    }

    const priceAtPurchase = ticketType.price
    const total = priceAtPurchase * quantity

    // 2) Derive a deterministic order number so refreshes and retries reuse the same order.
    const orderNumber = buildOrderNumberFromAttemptId(attemptId)

    const existingOrder = await prisma.ticketOrder.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        ticketTypeId: true,
        buyerName: true,
        buyerEmail: true,
        buyerPhone: true,
        quantity: true,
        priceAtPurchase: true,
        total: true,
        paymentSessionStatus: true,
        midtransToken: true,
        midtransRedirectUrl: true,
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
      const hasSameDetails =
        existingOrder.ticketTypeId === ticketTypeId &&
        existingOrder.buyerName === buyerName.trim() &&
        existingOrder.buyerEmail === buyerEmail.trim() &&
        existingOrder.buyerPhone === buyerPhone.trim() &&
        existingOrder.quantity === quantity &&
        existingOrder.priceAtPurchase === priceAtPurchase &&
        existingOrder.total === total

      if (!hasSameDetails) {
        return NextResponse.json(
          {
            message:
              "This payment session no longer matches your ticket order. Please return to booking and try again.",
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

    let orderRecord = existingOrder

    if (!orderRecord) {
      // 3) Atomically reserve quota so two concurrent checkouts can't oversell it.
      const quotaReservation = await prisma.ticketType.updateMany({
        where: {
          id: ticketTypeId,
          active: true,
          sold: {
            lte: ticketType.quota - quantity,
          },
        },
        data: {
          sold: {
            increment: quantity,
          },
        },
      })

      if (quotaReservation.count !== 1) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Not enough tickets available for the requested quantity.",
          },
          { status: 409 },
        )
      }

      try {
        orderRecord = await prisma.ticketOrder.create({
          data: {
            orderNumber,
            ticketTypeId,
            buyerName: buyerName.trim(),
            buyerEmail: buyerEmail.trim(),
            buyerPhone: buyerPhone.trim(),
            quantity,
            priceAtPurchase,
            total,
            status: "Pending",
            paymentSessionStatus: "PREPARING",
          },
          select: {
            id: true,
            orderNumber: true,
          },
        })
      } catch (error) {
        // Release the reserved quota if order creation itself failed.
        await prisma.ticketType.update({
          where: { id: ticketTypeId },
          data: { sold: { decrement: quantity } },
        })

        throw error
      }
    } else {
      const preparingOrder = await prisma.ticketOrder.updateMany({
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
      // 4) Request Snap token from Midtrans using trusted server credentials.
      const transaction = await snap.createTransaction({
        transaction_details: {
          order_id: orderNumber,
          gross_amount: total,
        },
        item_details: [
          {
            id: ticketTypeId,
            price: priceAtPurchase,
            quantity,
            name: `${ticketType.event?.name || "Event"} - ${ticketType.name}`,
          },
        ],
        customer_details: {
          first_name: buyerName.trim(),
          email: buyerEmail.trim(),
          phone: buyerPhone.trim(),
        },
      })

      await prisma.ticketOrder.update({
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
      await prisma.ticketOrder.update({
        where: { orderNumber },
        data: {
          paymentSessionStatus: "FAILED",
        },
      })

      throw error
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to initialize ticket payment."

    return NextResponse.json({ message }, { status: 500 })
  }
}
