"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const ALLOWED_STATUSES = ["Pending", "Approved", "Rejected", "Completed"]

export default function ReturnStatusForm({ id, initialStatus }) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setMessage("")
      setIsError(false)

      const response = await fetch(`/api/returns/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update status.")
      }

      setMessage(payload?.message || "Status updated.")
      router.refresh()
    } catch (error) {
      setIsError(true)
      setMessage(
        error instanceof Error ? error.message : "Failed to update status.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center justify-end gap-2">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-8 rounded border border-black/20 bg-white px-2 text-xs text-black outline-none"
        >
          {ALLOWED_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>

      {message ? (
        <p
          className={`max-w-56 text-right text-xs ${isError ? "text-red-200" : "text-white/80"}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
