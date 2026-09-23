import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import BookingForm from "./BookingForm"

export const dynamic = "force-dynamic"

const FALLBACK_POSTER = "/poster.png"

function formatEventDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value)
}

export default async function BookingPage({ params }) {
  const { slug } = await params

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      ticketTypes: {
        where: { active: true },
        orderBy: { price: "asc" },
      },
    },
  })

  if (!event || !event.active) {
    notFound()
  }

  const ticketTypes = event.ticketTypes.map((ticketType) => ({
    id: ticketType.id,
    name: ticketType.name,
    price: ticketType.price,
    quota: ticketType.quota,
    sold: ticketType.sold,
  }))

  const isSoldOut =
    ticketTypes.length === 0 ||
    ticketTypes.every((ticketType) => ticketType.sold >= ticketType.quota)

  return (
    <div className="w-full min-h-screen bg-black font-benguiat text-white">
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 md:px-10 lg:pb-24 lg:pt-16">
        <h1 className="text-3xl md:text-5xl">Chekout Your Ticket</h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <section>
            <div className="overflow-hidden rounded-2xl border border-white/20">
              <img
                src={event.posterUrl || FALLBACK_POSTER}
                alt={`${event.name} poster`}
                className="w-full object-cover"
              />
            </div>

            <div className="mt-6 space-y-2">
              <h2 className="text-2xl md:text-3xl">{event.name}</h2>
              <p className="text-sm text-white/75 md:text-base">
                {formatEventDate(event.date)}
              </p>
              <p className="text-sm text-white/75 md:text-base">
                {event.location}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/20 p-6 md:p-8 lg:p-10">
            <BookingForm ticketTypes={ticketTypes} isSoldOut={isSoldOut} />
          </section>
        </div>
      </main>
    </div>
  )
}
