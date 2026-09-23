import Link from "next/link"
import { prisma } from "@/lib/prisma"
import CreateEventForm from "./CreateEventForm"
import EventDeleteButton from "./EventDeleteButton"

export const dynamic = "force-dynamic"

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
    include: {
      _count: {
        select: { ticketTypes: true },
      },
    },
  })

  return (
    <section className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Events</h1>
      </div>

      <CreateEventForm />

      <div className="overflow-hidden rounded-xl border border-white/50 bg-[#2f5a44] shadow-xl">
        {events.length === 0 ? (
          <div className="p-6 text-sm text-white/80">
            No events yet. Use the form above to create your first event.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/25">
              <thead className="bg-[#264b38] text-left text-xs uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Ticket Types</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/15 bg-white text-sm text-black">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-3 font-semibold">{event.name}</td>
                    <td className="px-4 py-3">{formatDate(event.date)}</td>
                    <td className="px-4 py-3">{event.location}</td>
                    <td className="px-4 py-3">{event._count.ticketTypes}</td>
                    <td className="px-4 py-3">
                      {event.active ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/dashboard/events/${event.id}`}
                          className="rounded border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                        >
                          Edit
                        </Link>
                        <EventDeleteButton id={event.id} name={event.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
