import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { slugify } from "@/lib/slug"
import { deletePosterFile, parsePosterFile, savePosterFile } from "./upload-utils"

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function parseDate(value: string): Date | null {
  if (!value) {
    return null
  }

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

async function generateUniqueEventSlug(name: string): Promise<string> {
  const base = slugify(name) || "event"
  let candidate = base
  let suffix = 2

  while (await prisma.event.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }

  return candidate
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
    include: {
      _count: {
        select: { ticketTypes: true },
      },
    },
  })

  return NextResponse.json({ events })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()

  const name = getFormString(formData, "name")
  const location = getFormString(formData, "location")
  const description = getFormString(formData, "description")
  const date = parseDate(getFormString(formData, "date"))
  const active = getFormString(formData, "active") !== "false"
  const posterFile = parsePosterFile(formData)

  if (!name) {
    return NextResponse.json(
      { message: "Event name is required." },
      { status: 400 },
    )
  }

  if (!location) {
    return NextResponse.json(
      { message: "Event location is required." },
      { status: 400 },
    )
  }

  if (!date) {
    return NextResponse.json(
      { message: "A valid event date is required." },
      { status: 400 },
    )
  }

  let posterUrl: string | null = null

  try {
    if (posterFile) {
      posterUrl = await savePosterFile(posterFile)
    }

    const slug = await generateUniqueEventSlug(name)

    const event = await prisma.event.create({
      data: {
        slug,
        name,
        description: description || null,
        date,
        location,
        posterUrl,
        active,
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    if (posterUrl) {
      await deletePosterFile(posterUrl)
    }

    const message =
      error instanceof Error ? error.message : "Failed to create event."

    return NextResponse.json({ message }, { status: 400 })
  }
}
