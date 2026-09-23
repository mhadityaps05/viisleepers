"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

const initialNewTicketType = {
  name: "",
  price: "",
  quota: "",
  active: true,
}

export default function TicketTypeManager({ eventId, ticketTypes }) {
  const router = useRouter()
  const [newTicketType, setNewTicketType] = useState(initialNewTicketType)
  const [editing, setEditing] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleNewChange = (event) => {
    const { name, value, type, checked } = event.target

    setNewTicketType((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    setError("")

    const name = newTicketType.name.trim()
    const price = Number(newTicketType.price)
    const quota = Number(newTicketType.quota)

    if (!name) {
      setError("Ticket type name is required.")
      return
    }

    if (!Number.isInteger(price) || price < 0) {
      setError("Price must be a non-negative integer.")
      return
    }

    if (!Number.isInteger(quota) || quota < 0) {
      setError("Quota must be a non-negative integer.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/admin/events/${eventId}/ticket-types`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            price,
            quota,
            active: newTicketType.active,
          }),
        },
      )

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to create ticket type.")
      }

      setNewTicketType(initialNewTicketType)
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create ticket type.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartEdit = (ticketType) => {
    setError("")
    setEditing({
      id: ticketType.id,
      name: ticketType.name,
      price: String(ticketType.price),
      quota: String(ticketType.quota),
      active: ticketType.active,
    })
  }

  const handleSaveEdit = async () => {
    if (!editing) {
      return
    }

    const name = editing.name.trim()
    const price = Number(editing.price)
    const quota = Number(editing.quota)

    if (!name) {
      setError("Ticket type name is required.")
      return
    }

    if (!Number.isInteger(price) || price < 0) {
      setError("Price must be a non-negative integer.")
      return
    }

    if (!Number.isInteger(quota) || quota < 0) {
      setError("Quota must be a non-negative integer.")
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/ticket-types/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, quota, active: editing.active }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update ticket type.")
      }

      setEditing(null)
      router.refresh()
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update ticket type.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (ticketType) => {
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/admin/ticket-types/${ticketType.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: ticketType.name,
            price: ticketType.price,
            quota: ticketType.quota,
            active: !ticketType.active,
          }),
        },
      )

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to toggle ticket type.")
      }

      router.refresh()
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to toggle ticket type.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (ticketType) => {
    if (ticketType.sold > 0) {
      window.alert(
        `"${ticketType.name}" already has ${ticketType.sold} ticket(s) sold. Disable it instead of deleting.`,
      )
      return
    }

    const confirmed = window.confirm(`Delete ticket type "${ticketType.name}"?`)
    if (!confirmed) {
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/admin/ticket-types/${ticketType.id}`,
        { method: "DELETE" },
      )

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to delete ticket type.")
      }

      router.refresh()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete ticket type.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Ticket Types</h2>

      <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-6 shadow-xl">
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-white">
            Name
            <input
              name="name"
              value={newTicketType.name}
              onChange={handleNewChange}
              placeholder="Regular, VIP, ..."
              className="rounded-md border border-white/60 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-green-700"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-white">
            Price (IDR)
            <input
              name="price"
              value={newTicketType.price}
              onChange={handleNewChange}
              inputMode="numeric"
              placeholder="150000"
              className="rounded-md border border-white/60 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-green-700"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-white">
            Quota
            <input
              name="quota"
              value={newTicketType.quota}
              onChange={handleNewChange}
              inputMode="numeric"
              placeholder="200"
              className="rounded-md border border-white/60 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-green-700"
            />
          </label>

          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-white">
              <input
                type="checkbox"
                name="active"
                checked={newTicketType.active}
                onChange={handleNewChange}
              />
              Active
            </label>
          </div>

          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md border border-white bg-white px-4 py-2 text-sm font-semibold text-[#3C6D53] transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Add Ticket Type"}
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
        {ticketTypes.length === 0 ? (
          <div className="p-6 text-sm text-white/80">
            No ticket types yet. Add one using the form above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/25">
              <thead className="bg-[#264b38] text-left text-xs uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Quota</th>
                  <th className="px-4 py-3">Sold</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/15 bg-white text-sm text-black">
                {ticketTypes.map((ticketType) => {
                  const isEditing = editing?.id === ticketType.id

                  return (
                    <tr key={ticketType.id}>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editing.name}
                            onChange={(event) =>
                              setEditing((current) =>
                                current
                                  ? { ...current, name: event.target.value }
                                  : current,
                              )
                            }
                            className="w-full rounded border border-gray-300 px-2 py-1"
                          />
                        ) : (
                          <span className="font-semibold">
                            {ticketType.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editing.price}
                            onChange={(event) =>
                              setEditing((current) =>
                                current
                                  ? { ...current, price: event.target.value }
                                  : current,
                              )
                            }
                            inputMode="numeric"
                            className="w-28 rounded border border-gray-300 px-2 py-1"
                          />
                        ) : (
                          formatRupiah(ticketType.price)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={editing.quota}
                            onChange={(event) =>
                              setEditing((current) =>
                                current
                                  ? { ...current, quota: event.target.value }
                                  : current,
                              )
                            }
                            inputMode="numeric"
                            className="w-24 rounded border border-gray-300 px-2 py-1"
                          />
                        ) : (
                          ticketType.quota
                        )}
                      </td>
                      <td className="px-4 py-3">{ticketType.sold}</td>
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
                        ) : ticketType.active ? (
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
                                onClick={() => handleStartEdit(ticketType)}
                                disabled={isSubmitting}
                                className="rounded border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleActive(ticketType)}
                                disabled={isSubmitting}
                                className="rounded border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                              >
                                {ticketType.active ? "Disable" : "Enable"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(ticketType)}
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
