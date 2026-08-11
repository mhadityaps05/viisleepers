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

const COURIER_OPTIONS = ["JNE", "J&T", "SiCepat"]
const COURIER_CODE_MAP = {
  JNE: "jne",
  "J&T": "jnt",
  SiCepat: "sicepat",
}

const DEFAULT_ITEM_WEIGHT = 500

function normalizeCourierCode(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

function toServicePrice(service) {
  const candidates = [
    service?.price,
    service?.amount,
    service?.courier_price,
    service?.cost,
  ]

  for (const value of candidates) {
    const amount = Number(value)
    if (Number.isFinite(amount) && amount >= 0) {
      return amount
    }
  }

  return null
}

function normalizeRatesResponse(payload) {
  const pricing = Array.isArray(payload?.pricing)
    ? payload.pricing
    : Array.isArray(payload?.data?.pricing)
      ? payload.data.pricing
      : []

  return pricing
    .map((item, index) => {
      const courierCode = normalizeCourierCode(
        item?.courier_code || item?.courier_name || item?.courier,
      )
      const serviceCode = String(
        item?.courier_service_code || item?.courier_type || item?.service || "",
      ).trim()
      const serviceName = String(
        item?.courier_service_name || item?.service_name || serviceCode,
      ).trim()
      const price = toServicePrice(item)
      const etd = String(
        item?.courier_duration || item?.duration || item?.etd || "",
      ).trim()

      if (!courierCode || !serviceCode || price === null) {
        return null
      }

      return {
        id: `${courierCode}-${serviceCode}-${index}`,
        courierCode,
        serviceCode,
        serviceName,
        price,
        etd,
      }
    })
    .filter(Boolean)
}

function normalizeApiArray(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  return []
}

function buildAreaLabel(area) {
  return [
    area?.name,
    area?.district,
    area?.city,
    area?.province,
    area?.postal_code,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ")
}

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
  const [selectedCourier, setSelectedCourier] = useState("")
  const [shippingService, setShippingService] = useState("")
  const [shippingServices, setShippingServices] = useState([])
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false)
  const [shippingRatesError, setShippingRatesError] = useState("")
  const [areaQuery, setAreaQuery] = useState(
    [formData.city, formData.province].filter(Boolean).join(", "),
  )
  const [areaResults, setAreaResults] = useState([])
  const [selectedAreaId, setSelectedAreaId] = useState("")
  const [selectedArea, setSelectedArea] = useState(null)
  const [isLoadingAreas, setIsLoadingAreas] = useState(false)
  const [areaError, setAreaError] = useState("")
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false)
  const fieldRefs = useRef({})
  const toastTimerRef = useRef(null)
  const areaRequestIdRef = useRef(0)
  const shippingRequestIdRef = useRef(0)

  const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const normalizedQuery = areaQuery.trim()

    if (selectedArea && normalizedQuery === buildAreaLabel(selectedArea)) {
      setAreaResults([])
      setIsLoadingAreas(false)
      return
    }

    if (normalizedQuery.length < 3) {
      setAreaResults([])
      setIsLoadingAreas(false)
      setAreaError("")
      setIsAreaDropdownOpen(false)
      return
    }

    let isActive = true
    const requestId = areaRequestIdRef.current + 1
    areaRequestIdRef.current = requestId

    const timeoutId = setTimeout(async () => {
      try {
        setIsLoadingAreas(true)
        setAreaError("")
        setIsAreaDropdownOpen(true)

        const response = await fetch(
          `/api/shipping/areas?input=${encodeURIComponent(normalizedQuery)}`,
          {
            cache: "no-store",
          },
        )
        const payload = await response.json().catch(() => ({}))

        if (!response.ok || payload?.success !== true) {
          throw new Error(payload?.message || "Failed to search areas.")
        }

        if (!isActive || areaRequestIdRef.current !== requestId) {
          return
        }

        const nextAreas = normalizeApiArray(payload)
        setAreaResults(nextAreas)
      } catch {
        if (!isActive || areaRequestIdRef.current !== requestId) {
          return
        }

        setAreaError("Failed to search areas. Please try again.")
        setAreaResults([])
      } finally {
        if (isActive && areaRequestIdRef.current === requestId) {
          setIsLoadingAreas(false)
        }
      }
    }, 300)

    return () => {
      isActive = false
      clearTimeout(timeoutId)
    }
  }, [areaQuery, selectedArea])

  useEffect(() => {
    const courierCode = COURIER_CODE_MAP[selectedCourier]

    setShippingService("")
    setShippingServices([])
    setShippingRatesError("")

    if (!selectedCourier) {
      setIsCalculatingShipping(false)
      return
    }

    if (!selectedAreaId) {
      setIsCalculatingShipping(false)
      setShippingRatesError("Please select a shipping area first.")
      return
    }

    if (!courierCode) {
      setIsCalculatingShipping(false)
      setShippingRatesError("Selected courier is not supported.")
      return
    }

    const items = cartItems
      .map((item) => ({
        name: String(item?.name || "").trim(),
        weight:
          Number(item?.weight) > 0 ? Number(item.weight) : DEFAULT_ITEM_WEIGHT,
        quantity: Number(item?.quantity) || 0,
      }))
      .filter((item) => item.name && item.quantity > 0)

    if (items.length === 0) {
      setIsCalculatingShipping(false)
      setShippingRatesError("No valid cart items for shipping calculation.")
      return
    }

    let isActive = true
    const requestId = shippingRequestIdRef.current + 1
    shippingRequestIdRef.current = requestId

    const fetchShippingRates = async () => {
      try {
        setIsCalculatingShipping(true)

        const response = await fetch("/api/shipping/rates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            destination_area_id: selectedAreaId,
            items,
          }),
        })

        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(payload?.message || "Failed to calculate shipping.")
        }

        if (!isActive || shippingRequestIdRef.current !== requestId) {
          return
        }

        const allRates = normalizeRatesResponse(payload)
        const courierServices = allRates.filter(
          (service) => service.courierCode === courierCode,
        )

        if (courierServices.length === 0) {
          setShippingRatesError(
            `No shipping services available for ${selectedCourier}.`,
          )
          setShippingServices([])
          return
        }

        setShippingServices(courierServices)
      } catch (error) {
        if (!isActive || shippingRequestIdRef.current !== requestId) {
          return
        }

        setShippingServices([])
        setShippingRatesError(
          error instanceof Error
            ? error.message
            : "Failed to calculate shipping.",
        )
      } finally {
        if (isActive && shippingRequestIdRef.current === requestId) {
          setIsCalculatingShipping(false)
        }
      }
    }

    fetchShippingRates()

    return () => {
      isActive = false
    }
  }, [cartItems, selectedAreaId, selectedCourier])

  const selectedShippingService =
    shippingServices.find((service) => service.id === shippingService) || null
  const shippingCost = selectedShippingService?.price || 0
  const displayTotal = cartTotal + shippingCost

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

    if (isCalculatingShipping) {
      setSubmitError("Shipping is still being calculated. Please wait.")
      return
    }

    if (shippingRatesError) {
      setSubmitError("Please resolve shipping issues before continuing.")
      return
    }

    if (!selectedCourier || !selectedShippingService) {
      setSubmitError(
        "Please select a shipping courier and shipping service before payment.",
      )
      showToast(
        "Shipping Required",
        "Select courier and shipping service to continue payment.",
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

    const shippingFee = shippingCost
    const subtotal = cartTotal
    const totalAmount = subtotal + shippingFee
    const attemptId = createCheckoutAttemptId()
    const paymentPayload = {
      attemptId,
      customerInformation,
      shippingAddress,
      cartItems,
      shipping: {
        courier: selectedCourier,
        service: selectedShippingService.serviceCode,
        estimatedDelivery: selectedShippingService.etd,
        destinationAreaId: selectedAreaId,
      },
      totals: {
        subtotal,
        shippingFee,
        total: totalAmount,
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

  const handleAreaInputChange = (event) => {
    const nextQuery = event.target.value

    setAreaQuery(nextQuery)
    setSelectedAreaId("")
    setSelectedArea(null)
    setAreaError("")
    setAreaResults([])
    setIsAreaDropdownOpen(true)
    setSelectedCourier("")
    setShippingService("")
    setShippingServices([])
    setShippingRatesError("")
    setIsCalculatingShipping(false)

    setFormData((prev) => ({
      ...prev,
      province: "",
      city: "",
    }))

    if (errors.province || errors.city) {
      setErrors((prev) => ({
        ...prev,
        province: validateField("province", ""),
        city: validateField("city", ""),
      }))
    }
  }

  const handleAreaSelect = (area) => {
    const nextSelectedArea = {
      id: String(area?.id || ""),
      name: String(area?.name || "").trim(),
      postal_code: String(area?.postal_code || "").trim(),
      administrative_division_level_1_name: String(
        area?.administrative_division_level_1_name || area?.province || "",
      ).trim(),
      administrative_division_level_2_name: String(
        area?.administrative_division_level_2_name || area?.city || "",
      ).trim(),
      administrative_division_level_3_name: String(
        area?.administrative_division_level_3_name || area?.district || "",
      ).trim(),
      province: String(area?.province || "").trim(),
      city: String(area?.city || "").trim(),
      district: String(area?.district || "").trim(),
    }

    setSelectedAreaId(nextSelectedArea.id)
    setSelectedArea(nextSelectedArea)
    setAreaQuery(buildAreaLabel(area))
    setAreaResults([])
    setAreaError("")
    setIsAreaDropdownOpen(false)
    setSelectedCourier("")
    setShippingService("")
    setShippingServices([])
    setShippingRatesError("")
    setIsCalculatingShipping(false)

    console.log("[BITESHIP] Selected area", nextSelectedArea)

    setFormData((prev) => ({
      ...prev,
      province: nextSelectedArea.province,
      city: nextSelectedArea.city,
      postalCode: prev.postalCode || nextSelectedArea.postal_code,
    }))

    if (errors.province || errors.city) {
      setErrors((prev) => ({
        ...prev,
        province: validateField("province", nextSelectedArea.province),
        city: validateField("city", nextSelectedArea.city),
      }))
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
                  <div className="md:col-span-2">
                    <label
                      htmlFor="shippingArea"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Shipping Area *
                    </label>
                    <div className="relative">
                      <input
                        id="shippingArea"
                        name="shippingArea"
                        type="text"
                        ref={(element) => {
                          fieldRefs.current.province = element
                          fieldRefs.current.city = element
                        }}
                        value={areaQuery}
                        onChange={handleAreaInputChange}
                        onFocus={() => {
                          if (areaResults.length > 0) {
                            setIsAreaDropdownOpen(true)
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setIsAreaDropdownOpen(false)
                          }, 150)

                          setErrors((prev) => ({
                            ...prev,
                            province: validateField(
                              "province",
                              selectedArea?.province || formData.province,
                            ),
                            city: validateField(
                              "city",
                              selectedArea?.city || formData.city,
                            ),
                          }))
                        }}
                        placeholder="Search area, district, city, or postal code"
                        aria-invalid={Boolean(errors.province || errors.city)}
                        aria-describedby={
                          errors.province || errors.city
                            ? "shipping-area-error"
                            : undefined
                        }
                        className={getFieldClassName("province")}
                      />

                      {isAreaDropdownOpen && areaResults.length > 0 ? (
                        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-white/20 bg-black shadow-2xl">
                          {areaResults.map((area) => (
                            <button
                              key={String(area.id)}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault()
                                handleAreaSelect(area)
                              }}
                              className="block w-full border-b border-white/10 px-4 py-3 text-left text-sm text-white transition last:border-b-0 hover:bg-white/10"
                            >
                              <span className="block text-white">
                                {String(area.name || "")}
                              </span>
                              <span className="mt-1 block text-xs text-white/60">
                                {buildAreaLabel(area)}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {isLoadingAreas ? (
                      <p className="mt-2 text-sm text-white/60">
                        Searching areas...
                      </p>
                    ) : null}
                    {areaError ? (
                      <p className="mt-2 text-sm text-red-500">{areaError}</p>
                    ) : null}
                    {errors.province || errors.city ? (
                      <p
                        id="shipping-area-error"
                        className="mt-2 text-sm text-red-500"
                      >
                        {errors.province || errors.city}
                      </p>
                    ) : null}
                    {selectedAreaId ? (
                      <p className="mt-2 text-xs text-white/45">
                        Area ID: {selectedAreaId}
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

                <section className="mt-12 space-y-6">
                  <h2 className="text-2xl md:text-3xl">Shipping Method</h2>

                  <div className="grid gap-4 md:grid-cols-2">
                    {COURIER_OPTIONS.map((courier) => {
                      const isSelected = selectedCourier === courier

                      return (
                        <label
                          key={courier}
                          className={`cursor-pointer rounded-xl border p-4 transition ${
                            isSelected
                              ? "border-white bg-white text-black"
                              : "border-white/30 bg-black text-white hover:border-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="shippingCourier"
                            value={courier}
                            checked={isSelected}
                            onChange={(event) => {
                              setSelectedCourier(event.target.value)
                            }}
                            className="sr-only"
                          />
                          <span className="text-base tracking-wide">
                            {courier}
                          </span>
                        </label>
                      )
                    })}
                  </div>

                  <div>
                    <label
                      htmlFor="shippingService"
                      className="mb-2 block text-sm text-white/80"
                    >
                      Shipping Service *
                    </label>
                    <select
                      id="shippingService"
                      name="shippingService"
                      value={shippingService}
                      onChange={(event) =>
                        setShippingService(event.target.value)
                      }
                      disabled={
                        !selectedCourier ||
                        isCalculatingShipping ||
                        shippingServices.length === 0
                      }
                      className="h-12 w-full rounded-xl border border-white/30 bg-black px-4 text-white/50 outline-none transition disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <option value="" className="text-black">
                        {!selectedCourier
                          ? "Select a courier first"
                          : isCalculatingShipping
                            ? "Calculating shipping..."
                            : shippingServices.length === 0
                              ? "No services available"
                              : "Select shipping service"}
                      </option>
                      {shippingServices.map((service) => (
                        <option
                          key={service.id}
                          value={service.id}
                          className="text-black"
                        >
                          {service.serviceCode}
                          {service.etd ? ` (${service.etd})` : ""} -{" "}
                          {formatRupiah(service.price)}
                        </option>
                      ))}
                    </select>
                    {isCalculatingShipping ? (
                      <p className="mt-2 text-sm text-white/60">
                        Calculating shipping...
                      </p>
                    ) : null}
                    {shippingRatesError ? (
                      <p className="mt-2 text-sm text-red-500">
                        {shippingRatesError}
                      </p>
                    ) : null}
                  </div>
                </section>
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
                    <span>Shipping Cost</span>
                    <span>{formatRupiah(shippingCost)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/20 pt-3 text-lg">
                    <span>Total</span>
                    <span>{formatRupiah(displayTotal)}</span>
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
