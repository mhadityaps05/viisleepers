"use client"

import { useState } from "react"
import { createCheckoutAttemptId } from "@/lib/checkout-payment"

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

function getRemainingStock(ticketType) {
  return Math.max(0, ticketType.quota - ticketType.sold)
}

export default function BookingForm({ ticketTypes, isSoldOut }) {
  const firstAvailable =
    ticketTypes.find((ticketType) => getRemainingStock(ticketType) > 0) ??
    ticketTypes[0]

  const [selectedTicketId, setSelectedTicketId] = useState(
    firstAvailable?.id ?? "",
  )
  const [quantity, setQuantity] = useState(MIN_QUANTITY)
  const [formData, setFormData] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [attemptId] = useState(() => createCheckoutAttemptId())

  const selectedTicket =
    ticketTypes.find((ticketType) => ticketType.id === selectedTicketId) ??
    firstAvailable

  const remainingStock = selectedTicket ? getRemainingStock(selectedTicket) : 0
  const maxQuantity = Math.max(MIN_QUANTITY, Math.min(MAX_QUANTITY, remainingStock))
  const total = selectedTicket ? selectedTicket.price * quantity : 0
  const isFormDisabled = isSoldOut || !selectedTicket

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectTicket = (ticketType) => {
    if (getRemainingStock(ticketType) <= 0) {
      return
    }

    setSelectedTicketId(ticketType.id)
    setQuantity(MIN_QUANTITY)
  }

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(MIN_QUANTITY, prev - 1))
  }

  const handleIncrease = () => {
    setQuantity((prev) => Math.min(maxQuantity, prev + 1))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError("")

    if (isFormDisabled) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/tickets/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attemptId,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          ticketTypeId: selectedTicket.id,
          quantity,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok || !payload?.redirect_url) {
        throw new Error(
          payload?.message ||
            "We couldn't prepare your payment. Please try again.",
        )
      }

      window.location.replace(payload.redirect_url)
    } catch (error) {
      setIsSubmitting(false)
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We couldn't prepare your payment. Please try again.",
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div>
        <h2 className="text-2xl md:text-3xl">Ticket Type</h2>

        {isSoldOut ? (
          <p className="mt-6 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-300">
            Sold Out — all ticket types for this event are no longer
            available.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {ticketTypes.map((ticketType) => {
              const isSelected = ticketType.id === selectedTicketId
              const isTicketSoldOut = getRemainingStock(ticketType) <= 0

              return (
                <label
                  key={ticketType.id}
                  className={`rounded-xl border p-4 transition ${
                    isTicketSoldOut
                      ? "cursor-not-allowed border-white/10 bg-black/40 text-white/40"
                      : isSelected
                        ? "cursor-pointer border-white bg-white text-black"
                        : "cursor-pointer border-white/30 bg-black text-white hover:border-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="ticketType"
                    value={ticketType.id}
                    checked={isSelected}
                    disabled={isTicketSoldOut}
                    onChange={() => handleSelectTicket(ticketType)}
                    className="sr-only"
                  />
                  <span className="block text-sm tracking-wide">
                    {ticketType.name}
                  </span>
                  <span className="mt-1 block text-xs opacity-80">
                    {isTicketSoldOut
                      ? "Sold Out"
                      : formatRupiah(ticketType.price)}
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl md:text-3xl">Quantity</h2>

        <div className="mt-6 flex items-center gap-6">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={isFormDisabled || quantity <= MIN_QUANTITY}
            aria-label="Decrease quantity"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 text-xl transition hover:border-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            &minus;
          </button>

          <span className="w-8 text-center text-xl">{quantity}</span>

          <button
            type="button"
            onClick={handleIncrease}
            disabled={isFormDisabled || quantity >= maxQuantity}
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
            <label htmlFor="name" className="mb-2 block text-sm text-white/80">
              Full Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isFormDisabled}
              autoComplete="name"
              className="h-12 w-full rounded-xl border border-white/30 bg-black px-4 text-white outline-none transition focus:border-white disabled:opacity-50"
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
              disabled={isFormDisabled}
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-white/30 bg-black px-4 text-white outline-none transition focus:border-white disabled:opacity-50"
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
              disabled={isFormDisabled}
              autoComplete="tel"
              inputMode="numeric"
              className="h-12 w-full rounded-xl border border-white/30 bg-black px-4 text-white outline-none transition focus:border-white disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-white/20 pt-6">
        <div className="flex items-center justify-between text-white/80">
          <span>
            {selectedTicket ? selectedTicket.name : "-"} &times; {quantity}
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
        disabled={isFormDisabled || isSubmitting}
        className="h-12 w-full rounded-xl bg-white px-6 text-base text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-black/70"
      >
        {isSoldOut
          ? "Sold Out"
          : isSubmitting
            ? "Preparing Payment..."
            : "Book Now"}
      </button>

      {submitError ? (
        <p className="text-sm text-white/70">{submitError}</p>
      ) : null}
    </form>
  )
}
