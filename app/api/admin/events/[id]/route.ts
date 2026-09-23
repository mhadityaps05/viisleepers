import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { deletePosterFile, parsePosterFile, savePosterFile } from "../upload-utils"

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin(request)

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      ticketTypes: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!event) {
    return NextResponse.json({ message: "Event not found." }, { status: 404 })
  }

  return NextResponse.json({ event })
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

  const existingEvent = await prisma.event.findUnique({ where: { id } })
  if (!existingEvent) {
    return NextResponse.json({ message: "Event not found." }, { status: 404 })
  }

  const formData = await request.formData()

  const name = getFormString(formData, "name")
  const location = getFormString(formData, "location")
  const description = getFormString(formData, "description")
  const activeRaw = formData.get("active")
  const active =
    activeRaw === null ? existingEvent.active : getFormString(formData, "active") !== "false"
  const date = parseDate(getFormString(formData, "date"))
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

  // Keep the existing poster unless a new file was actually uploaded.
  let posterUrl = existingEvent.posterUrl
  let uploadedNewPoster = false

  try {
    if (posterFile) {
      posterUrl = await savePosterFile(posterFile)
      uploadedNewPoster = true
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        name,
        description: description || null,
        date,
        location,
        posterUrl,
        active,
      },
    })

    if (uploadedNewPoster && existingEvent.posterUrl) {
      await deletePosterFile(existingEvent.posterUrl)
    }

    return NextResponse.json({ event })
  } catch (error) {
    if (uploadedNewPoster && posterUrl) {
      await deletePosterFile(posterUrl)
    }

    const message =
      error instanceof Error ? error.message : "Failed to update event."

    return NextResponse.json({ message }, { status: 400 })
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

  const existingEvent = await prisma.event.findUnique({ where: { id } })
  if (!existingEvent) {
    return NextResponse.json({ message: "Event not found." }, { status: 404 })
  }

  const soldTicketTypeCount = await prisma.ticketType.count({
    where: { eventId: id, sold: { gt: 0 } },
  })

  if (soldTicketTypeCount > 0) {
    return NextResponse.json(
      {
        message:
          "Cannot delete an event with ticket types that already have sold tickets. Disable the event instead.",
      },
      { status: 409 },
    )
  }

  try {
    await prisma.event.delete({ where: { id } })

    if (existingEvent.posterUrl) {
      await deletePosterFile(existingEvent.posterUrl)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      {
        message:
          "Cannot delete this event because it still has related ticket data.",
      },
      { status: 409 },
    )
  }
}
