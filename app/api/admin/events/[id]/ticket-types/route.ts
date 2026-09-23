import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request)

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: eventId } = await context.params

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) {
    return NextResponse.json({ message: "Event not found." }, { status: 404 })
  }

  try {
    const body = (await request.json()) as {
      name?: unknown
      price?: unknown
      quota?: unknown
      active?: unknown
    }

    const name = isNonEmptyString(body?.name) ? body.name.trim() : ""
    const price = Number(body?.price)
    const quota = Number(body?.quota)
    const active = body?.active === undefined ? true : Boolean(body.active)

    if (!name) {
      return NextResponse.json(
        { message: "Ticket type name is required." },
        { status: 400 },
      )
    }

    if (!isNonNegativeInteger(price)) {
      return NextResponse.json(
        { message: "Price must be a non-negative integer." },
        { status: 400 },
      )
    }

    if (!isNonNegativeInteger(quota)) {
      return NextResponse.json(
        { message: "Quota must be a non-negative integer." },
        { status: 400 },
      )
    }

    const ticketType = await prisma.ticketType.create({
      data: {
        eventId,
        name,
        price,
        quota,
        active,
      },
    })

    return NextResponse.json({ ticketType }, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create ticket type."

    return NextResponse.json({ message }, { status: 500 })
  }
}
