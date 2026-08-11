"use client"

import { useState } from "react"

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipping",
  "Delivered",
  "Cancelled",
  "Return Complete",
]

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function displayValue(value) {
  const normalized = String(value || "").trim()
  return normalized || "-"
}

export default function StatusForm({
  initialPaymentStatus,
  initialOrderStatus,
  initialShippingCourier,
  initialShippingService,
  initialEstimatedDelivery,
  initialShippingFee,
  initialTrackingNumber,
  orderId,
}) {
  const [orderStatus, setOrderStatus] = useState(initialOrderStatus)
  const [trackingNumber, setTrackingNumber] = useState(
    initialTrackingNumber || "",
  )
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const shippingCourier = String(initialShippingCourier || "").trim()
  const shippingService = String(initialShippingService || "").trim()
  const estimatedDelivery = String(initialEstimatedDelivery || "").trim()
  const shippingFee = Number(initialShippingFee) || 0

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
      <label className="block text-sm text-white/90" htmlFor="payment-status">
        Payment Status
      </label>
      <p
        id="payment-status"
        className="inline-flex h-10 w-full items-center rounded-md border border-white/40 bg-[#2f5a44] px-3 text-white"
      >
        {displayValue(initialPaymentStatus)}
      </p>

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

      <div className="rounded-md border border-white/30 bg-[#264b38] p-4">
        <h3 className="text-sm font-semibold text-white">
          Shipping Information
        </h3>
        <div className="mt-3 space-y-2 text-sm text-white/90">
          <p className="flex items-center justify-between gap-4">
            <span className="text-white/70">Courier</span>
            <span>{displayValue(shippingCourier)}</span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-white/70">Service</span>
            <span>{displayValue(shippingService)}</span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-white/70">Shipping Cost</span>
            <span>{formatRupiah(shippingFee)}</span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-white/70">Estimated Delivery</span>
            <span>{displayValue(estimatedDelivery)}</span>
          </p>
        </div>
      </div>

      {isShipping ? (
        <>
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
