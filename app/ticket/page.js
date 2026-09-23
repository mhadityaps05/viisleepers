import Link from "next/link"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const FALLBACK_POSTER = "/poster.png"

export default async function TicketListPage() {
  const events = await prisma.event.findMany({
    where: { active: true },
    orderBy: { date: "asc" },
  })

  return (
    <div className="w-full min-h-screen font-benguiat overflow-hidden">
      <div className="p-5">
        <div>
          <h1 className="lg:text-5xl text-3xl lg:pt-10">BOOK YOUR TICKET</h1>
        </div>

        <div className="w-full relative lg:overflow-x-auto">
          {events.length === 0 ? (
            <p className="mt-10 text-white/70">
              No events are open for booking right now.
            </p>
          ) : (
            <div className="lg:flex grid mt-5 gap-10">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/booking/${event.slug}`}
                  className="grid lg:w-90 gap-4"
                >
                  <img
                    src={event.posterUrl || FALLBACK_POSTER}
                    alt={`${event.name} poster`}
                  />
                  <div>
                    <p className="text-lg font-semibold">{event.name}</p>
                    <p className="text-sm text-white/70">{event.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
