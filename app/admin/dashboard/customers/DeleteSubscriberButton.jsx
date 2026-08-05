"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DeleteSubscriberButton({ id, email }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleDelete = async () => {
    const isConfirmed = window.confirm(
      `Delete subscriber ${email}? This action cannot be undone.`,
    )

    if (!isConfirmed) {
      return
    }

    try {
      setIsDeleting(true)
      setErrorMessage("")

      const response = await fetch(`/api/newsletter/${id}`, {
        method: "DELETE",
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to delete subscriber.")
      }

      router.refresh()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete subscriber.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>

      {errorMessage ? (
        <p className="max-w-48 text-right text-xs text-red-200">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
