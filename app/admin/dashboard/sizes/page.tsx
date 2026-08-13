"use client"

import { FormEvent, useEffect, useState } from "react"

type SizeItem = {
  id: string
  value: string
  active: boolean
  createdAt: string
  updatedAt: string
}

type EditingState = {
  id: string
  value: string
  active: boolean
} | null

export default function SizesPage() {
  const [sizes, setSizes] = useState<SizeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newValue, setNewValue] = useState("")
  const [newActive, setNewActive] = useState(true)
  const [editing, setEditing] = useState<EditingState>(null)
  const [error, setError] = useState("")

  const fetchSizes = async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await fetch("/api/admin/sizes", { cache: "no-store" })
      const payload = (await response.json().catch(() => ({}))) as {
        sizes?: SizeItem[]
        message?: string
      }

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load sizes.")
      }

      setSizes(Array.isArray(payload?.sizes) ? payload.sizes : [])
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load sizes.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSizes()
  }, [])

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    const value = newValue.trim()
    if (!value) {
      setError("Size value is required.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/sizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, active: newActive }),
      })

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string
      }

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to create size.")
      }

      setNewValue("")
      setNewActive(true)
      await fetchSizes()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create size.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartEdit = (item: SizeItem) => {
    setEditing({ id: item.id, value: item.value, active: item.active })
  }

  const handleSaveEdit = async () => {
    if (!editing) {
      return
    }

    const value = editing.value.trim()
    if (!value) {
      setError("Size value is required.")
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/sizes/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, active: editing.active }),
      })

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string
      }

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update size.")
      }

      setEditing(null)
      await fetchSizes()
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update size.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggle = async (item: SizeItem) => {
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/sizes/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: item.value, active: !item.active }),
      })

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string
      }

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to toggle size.")
      }

      await fetchSizes()
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to toggle size.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (item: SizeItem) => {
    const confirmed = window.confirm(`Delete size \"${item.value}\"?`)
    if (!confirmed) {
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/sizes/${item.id}`, {
        method: "DELETE",
      })

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string
      }

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to delete size.")
      }

      await fetchSizes()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete size.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-6 text-white">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Sizes</h1>
        <p className="text-white/80">
          Create custom size values and control whether they are selectable in
          the storefront.
        </p>
      </div>

      <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-6 shadow-xl">
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm font-semibold md:col-span-2">
            Size Value
            <input
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              placeholder="Examples: S, XL, 40, One Size"
              className="rounded-md border border-white/60 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-green-700"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-semibold pt-7">
            <input
              type="checkbox"
              checked={newActive}
              onChange={(event) => setNewActive(event.target.checked)}
            />
            Active
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md border border-white bg-white px-4 py-2 text-sm font-semibold text-[#3C6D53] transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Create Size"}
            </button>
          </div>
        </form>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-white/50 bg-[#2f5a44] shadow-xl">
        {isLoading ? (
          <div className="p-6 text-sm text-white/80">Loading sizes...</div>
        ) : sizes.length === 0 ? (
          <div className="p-6 text-sm text-white/80">No sizes created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/25">
              <thead className="bg-[#264b38] text-left text-xs uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/15 bg-white text-sm text-black">
                {sizes.map((size) => {
                  const isEditing = editing?.id === size.id

                  return (
                    <tr key={size.id}>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editing.value}
                            onChange={(event) =>
                              setEditing((current) =>
                                current
                                  ? { ...current, value: event.target.value }
                                  : current,
                              )
                            }
                            className="w-full rounded border border-gray-300 px-2 py-1"
                          />
                        ) : (
                          <span className="font-semibold">{size.value}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editing.active}
                              onChange={(event) =>
                                setEditing((current) =>
                                  current
                                    ? {
                                        ...current,
                                        active: event.target.checked,
                                      }
                                    : current,
                                )
                              }
                            />
                            Active
                          </label>
                        ) : size.active ? (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={isSubmitting}
                                className="rounded border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditing(null)}
                                disabled={isSubmitting}
                                className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(size)}
                                disabled={isSubmitting}
                                className="rounded border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggle(size)}
                                disabled={isSubmitting}
                                className="rounded border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                              >
                                {size.active ? "Disable" : "Enable"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(size)}
                                disabled={isSubmitting}
                                className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
