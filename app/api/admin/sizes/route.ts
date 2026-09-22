import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

function normalizeSizeValue(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim()
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sizes = await prisma.size.findMany({
    orderBy: [{ active: "desc" }, { value: "asc" }],
  })

  return NextResponse.json({ sizes })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { value?: unknown; active?: unknown }

    const value = normalizeSizeValue(body?.value)
    const active = body?.active === undefined ? true : Boolean(body.active)

    if (!value) {
      return NextResponse.json(
        { message: "Size value is required." },
        { status: 400 },
      )
    }

    const existing = await prisma.size.findFirst({
      where: {
        value: {
          equals: value,
          mode: "insensitive",
        },
      },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json(
        { message: "Size value already exists." },
        { status: 409 },
      )
    }

    const size = await prisma.size.create({
      data: {
        value,
        active,
      },
    })

    return NextResponse.json({ size }, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create size."

    return NextResponse.json({ message }, { status: 500 })
  }
}
