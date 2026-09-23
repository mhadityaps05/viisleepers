import Link from "next/link"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 10

function toPositiveInt(value, fallback = 1) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

function buildTicketsUrl(filters) {
  const params = new URLSearchParams()

  if (filters.eventId) {
    params.set("eventId", filters.eventId)
  }

  if (filters.page && Number(filters.page) > 1) {
    params.set("page", String(filters.page))
  }

  const query = params.toString()
  return query
    ? `/admin/dashboard/tickets?${query}`
    : "/admin/dashboard/tickets"
}

export default async function TicketsPage({ searchParams }) {
  const params = await searchParams

  const eventId = typeof params?.eventId === "string" ? params.eventId.trim() : ""
  const requestedPage = toPositiveInt(params?.page, 1)

  const events = await prisma.event.findMany({
    select: { id: true, name: true },
    orderBy: { date: "asc" },
  })

  const validEventId = events.some((event) => event.id === eventId)
    ? eventId
    : ""

  const where = validEventId ? { ticketType: { eventId: validEventId } } : {}

  const totalCount = await prisma.ticket.count({ where })
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.min(requestedPage, totalPages)

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
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
              name: true,
            },
          },
        },
      },
    },
  })

  const hasFilters = Boolean(validEventId)
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endItem = totalCount === 0 ? 0 : startItem + tickets.length - 1

  return (
    <section className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Tickets</h1>
      </div>

      <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-4 shadow-xl md:p-5">
        <form
          action="/admin/dashboard/tickets"
          method="GET"
          className="flex flex-col gap-3 lg:flex-row lg:items-center"
        >
          <select
            name="eventId"
            defaultValue={validEventId}
            className="h-10 w-full rounded-md border border-white/40 bg-[#264b38] px-3 text-sm text-white outline-none focus:border-white lg:w-72"
          >
            <option value="" className="text-black">
              All Events
            </option>
            {events.map((event) => (
              <option key={event.id} value={event.id} className="text-black">
                {event.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="h-10 rounded-md border border-white bg-white px-4 text-sm font-semibold text-[#3C6D53] transition hover:bg-green-100 lg:w-auto"
          >
            Apply
          </button>
        </form>

        {hasFilters ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href="/admin/dashboard/tickets"
              className="ml-auto inline-flex items-center rounded-md border border-white/40 px-3 py-1 text-xs text-white transition hover:border-white"
            >
              Clear Filters
            </Link>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/50 bg-[#2f5a44] shadow-xl">
        {tickets.length === 0 ? (
          <div className="p-6 text-sm text-white/80">No tickets found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/25">
              <thead className="bg-[#264b38] text-left text-xs uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3">Ticket Code</th>
                  <th className="px-4 py-3">Buyer Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Ticket Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Purchased At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/15 bg-white text-sm text-black">
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="px-4 py-3 font-mono font-semibold">
                      {ticket.code ?? "-"}
                    </td>
                    <td className="px-4 py-3">{ticket.buyerName}</td>
                    <td className="px-4 py-3">{ticket.buyerEmail}</td>
                    <td className="px-4 py-3">{ticket.ticketType.event.name}</td>
                    <td className="px-4 py-3">{ticket.ticketType.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(ticket.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/50 bg-[#2f5a44] px-4 py-3 text-sm text-white">
        <span>
          {totalCount === 0
            ? "No tickets"
            : `Showing ${startItem}-${endItem} of ${totalCount} tickets`}
        </span>

        <div className="flex items-center gap-2">
          <Link
            href={buildTicketsUrl({
              eventId: validEventId,
              page: currentPage - 1,
            })}
            className={`rounded border px-3 py-1 transition ${
              currentPage <= 1
                ? "pointer-events-none border-white/20 text-white/40"
                : "border-white/50 hover:border-white"
            }`}
          >
            Previous
          </Link>
          <Link
            href={buildTicketsUrl({
              eventId: validEventId,
              page: currentPage + 1,
            })}
            className={`rounded border px-3 py-1 transition ${
              currentPage >= totalPages
                ? "pointer-events-none border-white/20 text-white/40"
                : "border-white/50 hover:border-white"
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </section>
  )
}
