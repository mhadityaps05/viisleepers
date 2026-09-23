import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request)

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  const existing = await prisma.ticketType.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json(
      { message: "Ticket type not found." },
      { status: 404 },
    )
  }

  try {
    const body = (await request.json()) as {
      name?: unknown
      price?: unknown
      quota?: unknown
      active?: unknown
    }

    const name = isNonEmptyString(body?.name) ? body.name.trim() : ""
    const price = body?.price === undefined ? existing.price : Number(body.price)
    const quota = body?.quota === undefined ? existing.quota : Number(body.quota)
    const active =
      body?.active === undefined ? existing.active : Boolean(body.active)

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

    if (quota < existing.sold) {
      return NextResponse.json(
        {
          message: `Quota cannot be lower than tickets already sold (${existing.sold}).`,
        },
        { status: 400 },
      )
    }

    const ticketType = await prisma.ticketType.update({
      where: { id },
      data: {
        name,
        price,
        quota,
        active,
      },
    })

    return NextResponse.json({ ticketType })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update ticket type."

    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request)

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  const existing = await prisma.ticketType.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json(
      { message: "Ticket type not found." },
      { status: 404 },
    )
  }

  if (existing.sold > 0) {
    return NextResponse.json(
      {
        message:
          "Cannot delete a ticket type that already has sold tickets. Disable it instead.",
      },
      { status: 409 },
    )
  }

  try {
    await prisma.ticketType.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      {
        message:
          "Cannot delete this ticket type because it still has related order data.",
      },
      { status: 409 },
    )
  }
}
