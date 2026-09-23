import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const eventId = request.nextUrl.searchParams.get("eventId")?.trim() || ""

  const tickets = await prisma.ticket.findMany({
    where: eventId ? { ticketType: { eventId } } : {},
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      buyerName: true,
      buyerEmail: true,
      status: true,
      createdAt: true,
      ticketType: {
        select: {
          name: true,
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  return NextResponse.json({ tickets })
}
