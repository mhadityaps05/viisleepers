"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/app/component/navbar/page"
import { useCart } from "@/lib/CartContext"
import {
  CHECKOUT_DRAFT_STORAGE_KEY,
  createCheckoutAttemptId,
  getPaymentAttemptStorageKey,
} from "@/lib/checkout-payment"

const initialForm = {
  name: "",
  email: "",
  phone: "",
  province: "",
  city: "",
  postalCode: "",
  fullAddress: "",
}

const REQUIRED_FIELDS = [
  "name",
  "email",
  "phone",
  "province",
  "city",
  "postalCode",
  "fullAddress",
]

const fieldLabels = {
  name: "Full Name",
  email: "Email",
  phone: "Phone Number",
  province: "Province",
  city: "City",
  postalCode: "Postal Code",
  fullAddress: "Address",
}

const fieldErrorMessages = {
  name: {
    required: "Please enter your full name.",
  },
  email: {
    required: "Please enter your email.",
    invalid: "Please enter a valid email address.",
  },
  phone: {
    required: "Please enter your phone number.",
    invalid: "Phone number must contain numbers only.",
    short: "Phone number must be at least 10 digits.",
  },
  province: {
    required: "Please enter your province.",
  },
  city: {
    required: "Please enter your city.",
  },
  postalCode: {
    required: "Please enter your postal code.",
    invalid: "Postal code must contain numbers only.",
  },
  fullAddress: {
    required: "Please enter your address.",
  },
}

function getInitialFormData() {
  if (typeof window === "undefined") {
    return initialForm
  }

  try {
    const storedDraft = sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY)

    if (!storedDraft) {
      return initialForm
    }

    const parsedDraft = JSON.parse(storedDraft)
    const nextFormData = parsedDraft?.formData

    if (!nextFormData || typeof nextFormData !== "object") {
      return initialForm
    }

    return {
      ...initialForm,
      ...nextFormData,
    }
  } catch {
    return initialForm
  }
}

function formatRupiah(value) {
  return `Rp.${Number(value || 0).toLocaleString("id-ID")}`
}

function getSelectedSize(item) {
  if (item?.size && String(item.size).trim()) {
    return String(item.size).trim()
  }

  return "Not selected"
}

export default function CheckoutPage() {
  const { cartItems, cartTotal } = useCart()
  const router = useRouter()
  const [formData, setFormData] = useState(getInitialFormData)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [toast, setToast] = useState(null)
  const fieldRefs = useRef({})
  const toastTimerRef = useRef(null)

  const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  const showToast = (title, description) => {
    setToast({
      id: Date.now(),
      title,
      description,
    })

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }

    toastTimerRef.current = setTimeout(() => {
      setToast(null)
    }, 5000)
  }

  const focusFirstInvalidField = (nextErrors) => {
    const firstInvalidField = REQUIRED_FIELDS.find((field) => nextErrors[field])

    if (!firstInvalidField) {
      return
    }

    const element = fieldRefs.current[firstInvalidField]

    if (!element) {
      return
    }

    element.focus({ preventScroll: true })
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  }

  const getFieldClassName = (fieldName) =>
    `h-12 w-full rounded-xl border bg-black px-4 text-white outline-none transition ${
      errors[fieldName]
        ? "border-red-500 focus:border-red-500"
        : "border-white/30 focus:border-white"
    }`

  const getTextareaClassName = (fieldName) =>
    `w-full rounded-xl border bg-black px-4 py-3 text-white outline-none transition ${
      errors[fieldName]
        ? "border-red-500 focus:border-red-500"
        : "border-white/30 focus:border-white"
    }`

  const validateField = (name, value) => {
    const trimmed = String(value ?? "").trim()
    const messages = fieldErrorMessages[name]

    if (!trimmed) {
      return messages?.required || `${fieldLabels[name]} is required.`
    }

    if (name === "email") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(trimmed)) {
        return messages.invalid
      }
    }

    if (name === "phone") {
      if (!/^\d+$/.test(trimmed)) {
        return messages.invalid
      }

      if (trimmed.length < 10) {
        return messages.short
      }
    }

    if (name === "postalCode") {
      if (!/^\d+$/.test(trimmed)) {
        return messages.invalid
      }
    }

    return ""
  }

  const validateForm = () => {
    const nextErrors = {}

    for (const field of REQUIRED_FIELDS) {
      const message = validateField(field, formData[field])
      if (message) {
        nextErrors[field] = message
      }
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalidField(nextErrors)
    }

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
        [name]: validateField(name, value),
      }))
    }
  }

  const handleBlur = (event) => {
    const { name, value } = event.target

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError("")

    if (!validateForm()) {
      showToast(
        "Incomplete Information",
        "Please complete all required fields before continuing.",
      )
      return
    }

    const customerInformation = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phone.trim(),
    }

    const shippingAddress = {
      provinceState: formData.province.trim(),
      city: formData.city.trim(),
      postalCode: formData.postalCode.trim(),
      fullAddress: formData.fullAddress.trim(),
    }

    const shippingFee = 0
    const subtotal = cartTotal
    const total = subtotal + shippingFee
    const attemptId = createCheckoutAttemptId()
    const paymentPayload = {
      attemptId,
      customerInformation,
      shippingAddress,
      cartItems,
      totals: {
        subtotal,
        shippingFee,
        total,
      },
    }

    if (!midtransClientKey) {
      setSubmitError("Midtrans client key is not configured.")
      return
    }

    try {
      setIsSubmitting(true)
      sessionStorage.setItem(
        CHECKOUT_DRAFT_STORAGE_KEY,
        JSON.stringify({
          formData,
          attemptId,
        }),
      )
      sessionStorage.setItem(
        getPaymentAttemptStorageKey(attemptId),
        JSON.stringify({
          ...paymentPayload,
          status: "pending",
          createdAt: Date.now(),
        }),
      )

      router.replace(`/checkout/preparing?attempt=${attemptId}`, {
        scroll: false,
      })
    } catch {
      setIsSubmitting(false)
      setSubmitError("Failed to prepare payment. Please try again.")
    }
  }

  return (
    <div className="relative z-10 min-h-screen w-full bg-black font-benguiat text-white">
      {toast ? (
        <div className="fixed right-5 top-5 z-50 w-[min(24rem,calc(100vw-2.5rem))] rounded-xl border border-red-500/60 bg-black/95 p-4 text-white shadow-2xl backdrop-blur">
          <p className="text-sm font-semibold">{toast.title}</p>
          <p className="mt-1 text-sm text-white/80">{toast.description}</p>
        </div>
      ) : null}

      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-6 pb-16 pt-28 md:px-10 lg:pb-24 lg:pt-36">
        <h1 className="text-4xl md:text-5xl">Checkout</h1>

        {cartItems.length === 0 ? (
          <section className="mt-14 rounded-2xl border border-white/20 p-8 md:p-12">
            <p className="text-xl text-white/80">
              Your bag is currently empty.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-flex items-center justify-center rounded-xl border border-white px-6 py-3 text-sm tracking-wide transition hover:bg-white hover:text-black"
            >
              Continue Shopping
            </Link>
          </section>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-12 space-y-12">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
              <section className="rounded-2xl border border-white/20 p-6 md:p-8 lg:p-10">
                <h2 className="text-2xl md:text-3xl">Customer Information</h2>

                <div className="mt-8 grid gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Full Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      ref={(element) => {
                        fieldRefs.current.name = element
                      }}
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="name"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      className={getFieldClassName("name")}
                    />
                    {errors.name ? (
                      <p id="name-error" className="mt-2 text-sm text-red-500">
                        {errors.name}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      ref={(element) => {
                        fieldRefs.current.email = element
                      }}
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="email"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={
                        errors.email ? "email-error" : undefined
                      }
                      className={getFieldClassName("email")}
                    />
                    {errors.email ? (
                      <p id="email-error" className="mt-2 text-sm text-red-500">
                        {errors.email}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Phone Number *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      ref={(element) => {
                        fieldRefs.current.phone = element
                      }}
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="tel"
                      inputMode="numeric"
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={
                        errors.phone ? "phone-error" : undefined
                      }
                      className={getFieldClassName("phone")}
                    />
                    {errors.phone ? (
                      <p id="phone-error" className="mt-2 text-sm text-red-500">
                        {errors.phone}
                      </p>
                    ) : null}
                  </div>
                </div>

                <h2 className="mt-12 text-2xl md:text-3xl">Shipping Address</h2>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="province"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Province *
                    </label>
                    <input
                      id="province"
                      name="province"
                      type="text"
                      ref={(element) => {
                        fieldRefs.current.province = element
                      }}
                      value={formData.province}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="address-level1"
                      aria-invalid={Boolean(errors.province)}
                      aria-describedby={
                        errors.province ? "province-error" : undefined
                      }
                      className={getFieldClassName("province")}
                    />
                    {errors.province ? (
                      <p
                        id="province-error"
                        className="mt-2 text-sm text-red-500"
                      >
                        {errors.province}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="city"
                      className="mb-2 block text-sm text-white/80"
                    >
                      City *
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      ref={(element) => {
                        fieldRefs.current.city = element
                      }}
                      value={formData.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="address-level2"
                      aria-invalid={Boolean(errors.city)}
                      aria-describedby={errors.city ? "city-error" : undefined}
                      className={getFieldClassName("city")}
                    />
                    {errors.city ? (
                      <p id="city-error" className="mt-2 text-sm text-red-500">
                        {errors.city}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="postalCode"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Postal Code *
                    </label>
                    <input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      ref={(element) => {
                        fieldRefs.current.postalCode = element
                      }}
                      value={formData.postalCode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="postal-code"
                      inputMode="numeric"
                      aria-invalid={Boolean(errors.postalCode)}
                      aria-describedby={
                        errors.postalCode ? "postalCode-error" : undefined
                      }
                      className={getFieldClassName("postalCode")}
                    />
                    {errors.postalCode ? (
                      <p
                        id="postalCode-error"
                        className="mt-2 text-sm text-red-500"
                      >
                        {errors.postalCode}
                      </p>
                    ) : null}
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="fullAddress"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Address *
                    </label>
                    <textarea
                      id="fullAddress"
                      name="fullAddress"
                      ref={(element) => {
                        fieldRefs.current.fullAddress = element
                      }}
                      value={formData.fullAddress}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      rows={4}
                      autoComplete="street-address"
                      aria-invalid={Boolean(errors.fullAddress)}
                      aria-describedby={
                        errors.fullAddress ? "fullAddress-error" : undefined
                      }
                      className={getTextareaClassName("fullAddress")}
                    />
                    {errors.fullAddress ? (
                      <p
                        id="fullAddress-error"
                        className="mt-2 text-sm text-red-500"
                      >
                        {errors.fullAddress}
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>

              <aside className="rounded-2xl border border-white/20 p-6 md:p-8 lg:p-10">
                <h2 className="text-2xl md:text-3xl">Order Summary</h2>

                <div className="mt-8 space-y-6">
                  {cartItems.map((item) => {
                    const itemSubtotal = item.price * item.quantity

                    return (
                      <article
                        key={`${item.productId}-${item.size}`}
                        className="rounded-xl border border-white/20 p-4"
                      >
                        <div className="flex items-start gap-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-20 w-20 rounded-md object-cover"
                          />

                          <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="text-lg leading-tight">
                              {item.name}
                            </h3>
                            <p className="text-sm text-white/75">
                              Selected Size: {getSelectedSize(item)}
                            </p>
                            <p className="text-sm text-white/75">
                              Quantity: {item.quantity}
                            </p>
                            <p className="text-sm text-white/75">
                              Price: {formatRupiah(item.price)}
                            </p>
                            <p className="text-sm text-white">
                              Subtotal: {formatRupiah(itemSubtotal)}
                            </p>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>

                <div className="mt-8 space-y-3 border-t border-white/20 pt-6">
                  <div className="flex items-center justify-between text-white/80">
                    <span>Subtotal</span>
                    <span>{formatRupiah(cartTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/20 pt-3 text-lg">
                    <span>Total</span>
                    <span>{formatRupiah(cartTotal)}</span>
                  </div>
                </div>
              </aside>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl bg-white px-6 text-base text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-black/70"
            >
              {isSubmitting ? "Preparing Payment..." : "Pay Now"}
            </button>

            {submitError ? (
              <p className="text-sm text-white/70">{submitError}</p>
            ) : null}
          </form>
        )}
      </main>
    </div>
  )
}
