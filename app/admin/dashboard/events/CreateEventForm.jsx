"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

const initialForm = {
  name: "",
  description: "",
  date: "",
  location: "",
  active: true,
}

export default function CreateEventForm() {
  const router = useRouter()
  const [form, setForm] = useState(initialForm)
  const [posterFile, setPosterFile] = useState(null)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const previewUrl = useMemo(
    () => (posterFile ? URL.createObjectURL(posterFile) : null),
    [posterFile],
  )

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handlePosterChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setPosterFile(file)
    event.target.value = ""
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

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

      const response = await fetch("/api/admin/events", {
        method: "POST",
        body: formData,
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to create event.")
      }

      setForm(initialForm)
      setPosterFile(null)
      router.refresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create event.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-6 text-white shadow-xl">
      <h2 className="mb-4 text-lg font-semibold">Add Event</h2>

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
            Allowed: jpg, jpeg, png, webp. Max 5MB.
          </p>

          {previewUrl ? (
            <div className="mt-1 w-40 rounded-lg border border-white/40 bg-white p-2">
              <Image
                src={previewUrl}
                alt="Poster preview"
                width={220}
                height={220}
                className="h-28 w-full rounded object-cover"
              />
            </div>
          ) : null}
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

        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md border border-white bg-white px-4 py-2 text-sm font-semibold text-[#3C6D53] transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  )
}
