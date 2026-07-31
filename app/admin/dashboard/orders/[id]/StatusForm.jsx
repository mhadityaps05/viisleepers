"use client"

import { useState } from "react"

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipping",
  "Delivered",
  "Cancelled",
]

export default function StatusForm({
  initialOrderStatus,
  initialCourier,
  initialTrackingNumber,
  orderId,
}) {
  const [orderStatus, setOrderStatus] = useState(initialOrderStatus)
  const [courier, setCourier] = useState(initialCourier || "")
  const [trackingNumber, setTrackingNumber] = useState(
    initialTrackingNumber || "",
  )
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    try {
      setIsSaving(true)

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderStatus,
          courier,
          trackingNumber,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setErrorMessage(payload?.message || "Failed to update order status.")
        return
      }

      setSuccessMessage("Order status updated successfully.")
    } catch {
      setErrorMessage("Failed to update order status.")
    } finally {
      setIsSaving(false)
    }
  }

  const isShipping = orderStatus === "Shipping"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm text-white/90" htmlFor="order-status">
        Order Status
      </label>
      <select
        id="order-status"
        value={orderStatus}
        onChange={(event) => setOrderStatus(event.target.value)}
        disabled={isSaving}
        className="h-10 w-full rounded-md border border-white/40 bg-[#2f5a44] px-3 text-white outline-none"
      >
        {ORDER_STATUSES.map((value) => (
          <option key={value} value={value} className="text-black">
            {value}
          </option>
        ))}
      </select>

      {isShipping ? (
        <>
          <div>
            <label
              className="mb-2 block text-sm text-white/90"
              htmlFor="courier"
            >
              Courier
            </label>
            <input
              id="courier"
              type="text"
              value={courier}
              onChange={(event) => setCourier(event.target.value)}
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-white/40 bg-[#2f5a44] px-3 text-white outline-none"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm text-white/90"
              htmlFor="tracking-number"
            >
              Tracking Number
            </label>
            <input
              id="tracking-number"
              type="text"
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-white/40 bg-[#2f5a44] px-3 text-white outline-none"
            />
          </div>
        </>
      ) : null}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-md border border-white bg-white px-4 py-2 text-sm font-semibold text-[#3C6D53] transition hover:bg-green-100"
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>

      {successMessage ? (
        <p className="text-sm text-white/90">{successMessage}</p>
      ) : null}
      {errorMessage ? (
        <p className="text-sm text-white/80">{errorMessage}</p>
      ) : null}
    </form>
  )
}
