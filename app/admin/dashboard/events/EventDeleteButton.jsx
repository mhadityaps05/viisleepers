"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function EventDeleteButton({ id, name }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete event "${name}"?`)
    if (!confirmed) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: "DELETE",
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to delete event.")
      }

      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete event."
      window.alert(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  )
}
