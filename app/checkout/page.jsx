"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/app/component/navbar/page"
import { useCart } from "@/lib/CartContext"

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
  name: "Name",
  email: "Email",
  phone: "Phone Number",
  province: "Province / State",
  city: "City",
  postalCode: "Postal Code",
  fullAddress: "Full Address",
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
  const { cartItems, cartTotal, clearCart } = useCart()
  const router = useRouter()
  const [formData, setFormData] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const isMissingRequired = useMemo(
    () =>
      REQUIRED_FIELDS.some((field) => !String(formData[field] ?? "").trim()),
    [formData],
  )

  const validateField = (name, value) => {
    const trimmed = String(value ?? "").trim()

    if (!trimmed) {
      return `${fieldLabels[name]} is required.`
    }

    if (name === "email") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(trimmed)) {
        return "Please enter a valid email address."
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

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerInformation,
          shippingAddress,
          cartItems,
          totals: {
            subtotal,
            shippingFee,
            total,
          },
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload?.order) {
        setSubmitError(payload?.message || "Failed to create order.")
        return
      }

      clearCart()
      router.push(
        `/checkout/success?orderNumber=${encodeURIComponent(payload.order.orderNumber)}&total=${payload.order.total}`,
      )
    } catch {
      setSubmitError("Failed to create order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative z-10 min-h-screen w-full bg-black font-benguiat text-white">
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
                      Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="h-12 w-full rounded-xl border border-white/30 bg-black px-4 text-white outline-none transition focus:border-white"
                    />
                    {errors.name ? (
                      <p className="mt-2 text-sm text-white/70">
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
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="h-12 w-full rounded-xl border border-white/30 bg-black px-4 text-white outline-none transition focus:border-white"
                    />
                    {errors.email ? (
                      <p className="mt-2 text-sm text-white/70">
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
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="h-12 w-full rounded-xl border border-white/30 bg-black px-4 text-white outline-none transition focus:border-white"
                    />
                    {errors.phone ? (
                      <p className="mt-2 text-sm text-white/70">
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
                      Province / State *
                    </label>
                    <input
                      id="province"
                      name="province"
                      type="text"
                      value={formData.province}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="h-12 w-full rounded-xl border border-white/30 bg-black px-4 text-white outline-none transition focus:border-white"
                    />
                    {errors.province ? (
                      <p className="mt-2 text-sm text-white/70">
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
                      value={formData.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="h-12 w-full rounded-xl border border-white/30 bg-black px-4 text-white outline-none transition focus:border-white"
                    />
                    {errors.city ? (
                      <p className="mt-2 text-sm text-white/70">
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
                      value={formData.postalCode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="h-12 w-full rounded-xl border border-white/30 bg-black px-4 text-white outline-none transition focus:border-white"
                    />
                    {errors.postalCode ? (
                      <p className="mt-2 text-sm text-white/70">
                        {errors.postalCode}
                      </p>
                    ) : null}
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="fullAddress"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Full Address *
                    </label>
                    <textarea
                      id="fullAddress"
                      name="fullAddress"
                      value={formData.fullAddress}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      rows={4}
                      className="w-full rounded-xl border border-white/30 bg-black px-4 py-3 text-white outline-none transition focus:border-white"
                    />
                    {errors.fullAddress ? (
                      <p className="mt-2 text-sm text-red-500">
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
              disabled={isMissingRequired || isSubmitting}
              className="h-12 w-full rounded-xl bg-white px-6 text-base text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-black/70"
            >
              {isSubmitting ? "Saving Order..." : "Continue to Payment"}
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
