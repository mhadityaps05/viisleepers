"use client"

import { useState } from "react"

const ORDER_STATUSES = [
  "Pending",
  "Paid",
  "Processing",
  "Shipped",
  "Completed",
  "Cancelled",
]

export default function StatusForm({ initialStatus, orderId }) {
  const [status, setStatus] = useState(initialStatus)
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
        body: JSON.stringify({ status }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setErrorMessage(payload?.message || "Failed to update order status.")
        return
      }

      setSuccessMessage("Status updated successfully.")
    } catch {
      setErrorMessage("Failed to update order status.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm text-white/90" htmlFor="order-status">
        Status
      </label>
      <select
        id="order-status"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        disabled={isSaving}
        className="h-10 w-full rounded-md border border-white/40 bg-[#2f5a44] px-3 text-white outline-none"
      >
        {ORDER_STATUSES.map((value) => (
          <option key={value} value={value} className="text-black">
            {value}
          </option>
        ))}
      </select>

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
