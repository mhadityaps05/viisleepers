"use client"

import { useState } from "react"
import Navbar from "@/app/component/navbar/page"
import Foots from "@/app/component/foots/page"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Page() {
  const [formData, setFormData] = useState({
    email: "",
    orderNumber: "",
    orderItems: "",
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const validateForm = () => {
    const nextErrors = {}

    const email = formData.email.trim().toLowerCase()
    const orderNumber = formData.orderNumber.trim()
    const orderItems = formData.orderItems.trim()

    if (!email || !EMAIL_PATTERN.test(email)) {
      nextErrors.email = "Please enter a valid email address."
    }

    if (!orderNumber) {
      nextErrors.orderNumber = "Please enter your order number."
    }

    if (!orderItems) {
      nextErrors.orderItems = "Please enter your order items."
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

      const response = await fetch("/api/returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          orderNumber: formData.orderNumber.trim(),
          orderItems: formData.orderItems.trim(),
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            "Failed to submit return request. Please try again.",
        )
      }

      setSuccessMessage(
        "Return request submitted successfully. Please check your email for confirmation.",
      )
      setFormData({
        email: "",
        orderNumber: "",
        orderItems: "",
      })
      setErrors({})
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to submit return request. Please try again.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full bg-black relative z-10 p-5 text-white min-h-screen font-benguiat">
      <Navbar />
      <img src="/asset/startreturn.png" alt="Start Return" />
      <div className="absolute top-25 lg:top-130 left-10 text-xl lg:text-5xl">
        Start a Return
      </div>
      <div className="pt-10 text-xl">Return form</div>
      <div className="pt-5 text-xl space-y-5 text-white/85">
        <p>
          To submit your return request, please complete the form below. A
          member of our team will contact you by email to confirm your request
          and provide a return authorization number along with further
          instructions.
        </p>
        <p>
          For pre-orders placed over 21 days ago, please contact us at
          <br />
          <a href="https://www.instagram.com/viisleepers" className="font-bold">
            instagram viisleepers
          </a>
          <br />
          Our team will assist with your return request, provided it falls
          within our 14-day return policy.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6">
        <div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Your email*"
            className={`w-full border-b bg-transparent py-3 focus:outline-none lg:mt-5 ${
              errors.email ? "border-red-500" : "border-white/60"
            }`}
          />
          {errors.email ? (
            <p className="pt-2 text-sm text-red-400">{errors.email}</p>
          ) : null}
        </div>

        <div>
          <input
            name="orderNumber"
            value={formData.orderNumber}
            onChange={handleChange}
            placeholder="Your order number*"
            className={`w-full border-b bg-transparent py-3 focus:outline-none lg:mt-5 ${
              errors.orderNumber ? "border-red-500" : "border-white/60"
            }`}
          />
          {errors.orderNumber ? (
            <p className="pt-2 text-sm text-red-400">{errors.orderNumber}</p>
          ) : null}
        </div>

        <div>
          <textarea
            name="orderItems"
            value={formData.orderItems}
            onChange={handleChange}
            placeholder="Your order items*"
            rows={4}
            className={`w-full border-b bg-transparent py-3 focus:outline-none lg:mt-5 ${
              errors.orderItems ? "border-red-500" : "border-white/60"
            }`}
          />
          {errors.orderItems ? (
            <p className="pt-2 text-sm text-red-400">{errors.orderItems}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="text-white w-full border hover:bg-white hover:text-black border-white font-bold py-2 px-4 rounded mt-5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Send"}
        </button>

        {successMessage ? (
          <p className="mt-4 text-sm text-white/80">{successMessage}</p>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 text-sm text-red-400">{errorMessage}</p>
        ) : null}
      </form>

      <Foots />
    </div>
  )
}
