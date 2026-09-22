import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

function normalizeSizeValue(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim()
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

  const existing = await prisma.size.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ message: "Size not found." }, { status: 404 })
  }

  try {
    const body = (await request.json()) as { value?: unknown; active?: unknown }

    const value = normalizeSizeValue(body?.value)
    const active =
      body?.active === undefined ? existing.active : Boolean(body.active)

    if (!value) {
      return NextResponse.json(
        { message: "Size value is required." },
        { status: 400 },
      )
    }

    const duplicate = await prisma.size.findFirst({
      where: {
        id: {
          not: id,
        },
        value: {
          equals: value,
          mode: "insensitive",
        },
      },
      select: { id: true },
    })

    if (duplicate) {
      return NextResponse.json(
        { message: "Size value already exists." },
        { status: 409 },
      )
    }

    const size = await prisma.size.update({
      where: { id },
      data: {
        value,
        active,
      },
    })

    return NextResponse.json({ size })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update size."

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

  const existing = await prisma.size.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ message: "Size not found." }, { status: 404 })
  }

  const usageCount = await prisma.productSize.count({ where: { sizeId: id } })

  if (usageCount > 0) {
    return NextResponse.json(
      {
        message:
          "Cannot delete size that is assigned to products. Disable it instead.",
      },
      { status: 409 },
    )
  }

  await prisma.size.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
