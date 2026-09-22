"use client"

import { useState } from "react"

const EVENT_DETAILS = {
  name: "Seven Sleepers Live Session",
  date: "Saturday, 14 November 2026",
  location: "Kesenian Hall, Jakarta",
}

const TICKET_TYPES = [
  { id: "regular", label: "Regular", price: 150000 },
  { id: "vip", label: "VIP", price: 300000 },
  { id: "vvip", label: "VVIP", price: 500000 },
]

const MIN_QUANTITY = 1
const MAX_QUANTITY = 10

const initialForm = {
  name: "",
  email: "",
  phone: "",
}

function formatRupiah(value) {
  return `Rp.${Number(value || 0).toLocaleString("id-ID")}`
}

function BookingPage() {
  const [selectedTicketId, setSelectedTicketId] = useState(TICKET_TYPES[0].id)
  const [quantity, setQuantity] = useState(MIN_QUANTITY)
  const [formData, setFormData] = useState(initialForm)

  const selectedTicket =
    TICKET_TYPES.find((ticket) => ticket.id === selectedTicketId) ||
    TICKET_TYPES[0]

  const total = selectedTicket.price * quantity

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(MIN_QUANTITY, prev - 1))
  }

  const handleIncrease = () => {
    setQuantity((prev) => Math.min(MAX_QUANTITY, prev + 1))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    // Dummy submit for now — payment/API integration comes later.
    console.log({
      ticketType: selectedTicket,
      quantity,
      total,
      buyer: formData,
    })
  }

  return (
    <div className="w-full min-h-screen bg-black font-benguiat text-white">
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 md:px-10 lg:pb-24 lg:pt-16">
        <h1 className="text-3xl md:text-5xl">Chekout Your Ticket</h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <section>
            <div className="overflow-hidden rounded-2xl border border-white/20">
              <img
                src="/poster.png"
                alt="Event Poster"
                className="w-full object-cover"
              />
            </div>

            <div className="mt-6 space-y-2">
              <h2 className="text-2xl md:text-3xl">{EVENT_DETAILS.name}</h2>
              <p className="text-sm text-white/75 md:text-base">
                {EVENT_DETAILS.date}
              </p>
              <p className="text-sm text-white/75 md:text-base">
                {EVENT_DETAILS.location}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/20 p-6 md:p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-10">
              <div>
                <h2 className="text-2xl md:text-3xl">Ticket Type</h2>

                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {TICKET_TYPES.map((ticket) => {
                    const isSelected = ticket.id === selectedTicketId

                    return (
                      <label
                        key={ticket.id}
                        className={`cursor-pointer rounded-xl border p-4 transition ${
                          isSelected
                            ? "border-white bg-white text-black"
                            : "border-white/30 bg-black text-white hover:border-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="ticketType"
                          value={ticket.id}
                          checked={isSelected}
                          onChange={() => setSelectedTicketId(ticket.id)}
                          className="sr-only"
                        />
                        <span className="block text-sm tracking-wide">
                          {ticket.label}
                        </span>
                        <span className="mt-1 block text-xs opacity-80">
                          {formatRupiah(ticket.price)}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl">Quantity</h2>

                <div className="mt-6 flex items-center gap-6">
                  <button
                    type="button"
                    onClick={handleDecrease}
                    disabled={quantity <= MIN_QUANTITY}
                    aria-label="Decrease quantity"
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 text-xl transition hover:border-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    &minus;
                  </button>

                  <span className="w-8 text-center text-xl">{quantity}</span>

                  <button
                    type="button"
                    onClick={handleIncrease}
                    disabled={quantity >= MAX_QUANTITY}
                    aria-label="Increase quantity"
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 text-xl transition hover:border-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl">Information</h2>

                <div className="mt-6 grid gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Full Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      className="h-12 w-full rounded-xl border border-white/30 bg-black px-4 text-white outline-none transition focus:border-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      className="h-12 w-full rounded-xl border border-white/30 bg-black px-4 text-white outline-none transition focus:border-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Phone Number *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      autoComplete="tel"
                      inputMode="numeric"
                      className="h-12 w-full rounded-xl border border-white/30 bg-black px-4 text-white outline-none transition focus:border-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-white/20 pt-6">
                <div className="flex items-center justify-between text-white/80">
                  <span>
                    {selectedTicket.label} &times; {quantity}
                  </span>
                  <span>{formatRupiah(total)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/20 pt-3 text-lg">
                  <span>Total</span>
                  <span>{formatRupiah(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="h-12 w-full rounded-xl bg-white px-6 text-base text-black transition hover:bg-white/90"
              >
                Book Now
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}

export default BookingPage
