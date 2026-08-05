"use client"

import { useState } from "react"
import Navbar from "@/app/component/navbar/page"
import Foots from "@/app/component/foots/page"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Page() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const validateForm = () => {
    const nextErrors = {}
    const name = formData.name.trim()
    const email = formData.email.trim().toLowerCase()
    const message = formData.message.trim()

    if (!name) {
      nextErrors.name = "Please enter your name."
    }

    if (!email || !EMAIL_PATTERN.test(email)) {
      nextErrors.email = "Please enter a valid email address."
    }

    if (!message) {
      nextErrors.message = "Please enter your message."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSuccessMessage("")
    setErrorMessage("")

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          message: formData.message.trim(),
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          payload?.message || "Failed to send your message. Please try again.",
        )
      }

      setSuccessMessage(
        "Thanks for reaching out. We will get back to you soon.",
      )
      setFormData({
        name: "",
        email: "",
        message: "",
      })
      setErrors({})
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to send your message. Please try again.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full bg-black text-white font-benguiat min-h-screen p-5">
      <Navbar />
      <div className="">
        <img src="/asset/contact.png" alt="Contact" />
      </div>

      <div className="absolute top-30 lg:top-130 left-10 text-xl lg:text-5xl">
        <p>Contact</p>
      </div>
      <div className="pt-10 text-xl">
        <p className="font-bold">Get in touch</p>
        <form onSubmit={handleSubmit} noValidate className="grid gap-5 pt-5">
          <div>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              className={`w-full border-b bg-transparent py-3 focus:outline-none lg:mt-5 ${
                errors.name ? "border-red-500" : "border-white/60"
              }`}
            />
            {errors.name ? (
              <p className="pt-2 text-sm text-red-400">{errors.name}</p>
            ) : null}
          </div>

          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your email"
              className={`w-full border-b bg-transparent py-3 focus:outline-none lg:mt-5 ${
                errors.email ? "border-red-500" : "border-white/60"
              }`}
            />
            {errors.email ? (
              <p className="pt-2 text-sm text-red-400">{errors.email}</p>
            ) : null}
          </div>

          <div>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Your message"
              rows={5}
              className={`w-full border-b bg-transparent py-3 focus:outline-none lg:mt-5 ${
                errors.message ? "border-red-500" : "border-white/60"
              }`}
            />
            {errors.message ? (
              <p className="pt-2 text-sm text-red-400">{errors.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="text-white w-full border hover:bg-white hover:text-black border-white font-bold py-2 px-4 rounded mt-5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : "Send"}
          </button>

          {successMessage ? (
            <p className="text-sm text-white/80">{successMessage}</p>
          ) : null}

          {errorMessage ? (
            <p className="text-sm text-red-400">{errorMessage}</p>
          ) : null}
        </form>
      </div>
      <Foots />
    </div>
  )
}
