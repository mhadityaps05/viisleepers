import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import EventForm from "./EventForm"
import TicketTypeManager from "./TicketTypeManager"

export const dynamic = "force-dynamic"

export default async function EventDetailPage({ params }) {
  const { id } = await params

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      ticketTypes: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!event) {
    notFound()
  }

  const ticketTypes = event.ticketTypes.map((ticketType) => ({
    id: ticketType.id,
    name: ticketType.name,
    price: ticketType.price,
    quota: ticketType.quota,
    sold: ticketType.sold,
    active: ticketType.active,
  }))

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Edit Event</h1>
        <Link
          href="/admin/dashboard/events"
          className="rounded-md border border-white px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-900"
        >
          Back to Events
        </Link>
      </div>

      <EventForm
        event={{
          id: event.id,
          name: event.name,
          description: event.description,
          date: event.date.toISOString(),
          location: event.location,
          posterUrl: event.posterUrl,
          active: event.active,
        }}
      />

      <TicketTypeManager eventId={event.id} ticketTypes={ticketTypes} />
    </section>
  )
}
