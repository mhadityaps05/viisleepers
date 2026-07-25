"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type ProductDeleteButtonProps = {
  id: string
  name: string
}

export default function ProductDeleteButton({
  id,
  name,
}: ProductDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete product \"${name}\"?`)
    if (!confirmed) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string
        } | null
        throw new Error(body?.message ?? "Failed to delete product.")
      }

      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete product."
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
