"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

function toDatetimeLocalValue(isoString) {
  if (!isoString) {
    return ""
  }

  const date = new Date(isoString)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const pad = (value) => String(value).padStart(2, "0")

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function EventForm({ event }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: event.name,
    description: event.description ?? "",
    date: toDatetimeLocalValue(event.date),
    location: event.location,
    active: event.active,
  })
  const [posterFile, setPosterFile] = useState(null)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const newPosterPreviewUrl = useMemo(
    () => (posterFile ? URL.createObjectURL(posterFile) : null),
    [posterFile],
  )

  useEffect(() => {
    return () => {
      if (newPosterPreviewUrl) {
        URL.revokeObjectURL(newPosterPreviewUrl)
      }
    }
  }, [newPosterPreviewUrl])

  const handleChange = (fieldEvent) => {
    const { name, value, type, checked } = fieldEvent.target

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handlePosterChange = (fieldEvent) => {
    const file = fieldEvent.target.files?.[0] ?? null
    setPosterFile(file)
    fieldEvent.target.value = ""
  }

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault()
    setError("")
    setSuccessMessage("")

    if (!form.name.trim() || !form.location.trim() || !form.date) {
      setError("Name, date, and location are required.")
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("name", form.name.trim())
      formData.append("description", form.description.trim())
      formData.append("date", new Date(form.date).toISOString())
      formData.append("location", form.location.trim())
      formData.append("active", String(form.active))

      if (posterFile) {
        formData.append("poster", posterFile)
      }

      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: "PUT",
        body: formData,
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update event.")
      }

      setPosterFile(null)
      setSuccessMessage("Event updated.")
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update event.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-6 text-white shadow-xl">
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-semibold">
          Name
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Event name"
            className="rounded-md border border-white/60 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-green-700"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold">
          Date &amp; Time
          <input
            name="date"
            type="datetime-local"
            value={form.date}
            onChange={handleChange}
            className="rounded-md border border-white/60 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-green-700"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold">
          Location
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Venue"
            className="rounded-md border border-white/60 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-green-700"
          />
        </label>

        <div className="flex flex-col gap-2 text-sm font-semibold md:col-span-2">
          Poster Image
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handlePosterChange}
            className="block w-full rounded-md border border-white/60 bg-white px-3 py-2 text-sm text-black file:mr-4 file:rounded file:border-0 file:bg-[#3C6D53] file:px-4 file:py-2 file:text-white"
          />
          <p className="text-xs font-normal text-white/85">
            Allowed: jpg, jpeg, png, webp. Max 5MB. Leave empty to keep the
            current poster.
          </p>

          <div className="mt-1 w-40 rounded-lg border border-white/40 bg-white p-2">
            {newPosterPreviewUrl ? (
              <>
                <Image
                  src={newPosterPreviewUrl}
                  alt="New poster preview"
                  width={220}
                  height={220}
                  className="h-28 w-full rounded object-cover"
                />
                <p className="mt-1 text-center text-[10px] font-normal text-black/60">
                  New poster
                </p>
              </>
            ) : event.posterUrl ? (
              <>
                <Image
                  src={event.posterUrl}
                  alt="Current poster"
                  width={220}
                  height={220}
                  className="h-28 w-full rounded object-cover"
                />
                <p className="mt-1 text-center text-[10px] font-normal text-black/60">
                  Current poster
                </p>
              </>
            ) : (
              <div className="flex h-28 w-full items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
                No poster
              </div>
            )}
          </div>
        </div>

        <label className="flex items-center gap-2 pt-7 text-sm font-semibold">
          <input
            type="checkbox"
            name="active"
            checked={form.active}
            onChange={handleChange}
          />
          Active
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold md:col-span-3">
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Event description"
            className="rounded-md border border-white/60 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-green-700"
          />
        </label>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm font-semibold text-red-800 md:col-span-3">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-md border border-green-200 bg-green-100 px-3 py-2 text-sm font-semibold text-green-800 md:col-span-3">
            {successMessage}
          </div>
        ) : null}

        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md border border-white bg-white px-4 py-2 text-sm font-semibold text-[#3C6D53] transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save Event"}
          </button>
        </div>
      </form>
    </div>
  )
}
