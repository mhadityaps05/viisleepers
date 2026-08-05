"use client"

import { useState } from "react"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Page() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubscribe = async () => {
    const trimmedEmail = email.trim().toLowerCase()

    setSuccessMessage("")
    setErrorMessage("")

    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.")
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 409) {
          setErrorMessage(
            "This email is already subscribed. Please use another email.",
          )
          return
        }

        setErrorMessage(
          payload?.message || "Failed to subscribe. Please try again.",
        )
        return
      }

      setSuccessMessage("Thank you for joining. You are now subscribed.")
      setEmail("")
    } catch {
      setErrorMessage("Failed to subscribe. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault()
      if (!isSubmitting) {
        handleSubscribe()
      }
    }
  }

  return (
    <div>
      <div className="pt-10">
        <div className="grid lg:flex justify-start lg:pl-100 overflow-hidden">
          <div className="grid grid-cols-3 gap-5">
            <div className="flex flex-col gap-5">
              <a className="cursor-pointer" href="../pages/contact">
                Contact Us
              </a>
              <a
                className="cursor-pointer"
                href="https://www.instagram.com/viisleepers/"
              >
                Instagram
              </a>
              <a className="cursor-pointer" href="../pages/faq">
                FAQs
              </a>
            </div>

            <div className="flex flex-col gap-5">
              <a className="cursor-pointer" href="../pages/shipping">
                Shipping & returns
              </a>
              <a className="cursor-pointer" href="../pages/startreturn">
                Start a return
              </a>
            </div>

            <div className="flex flex-col gap-5">
              <a className="cursor-pointer" href="../pages/terms&policies">
                Terms & policies
              </a>
            </div>
          </div>
          <div className="lg:ml-30 w-60 pt-10">
            <span className="text-white/50">JOIN US</span>
            <div className="lg:mt-5 mt-3 flex items-center gap-3 border-b border-white/50 pb-2">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your email address here"
                className="w-full bg-transparent py-2 text-white placeholder:text-white/45 focus:outline-none"
                aria-label="Newsletter email"
              />
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={isSubmitting}
                className="rounded border border-white/60 px-3 py-1 text-xs uppercase tracking-[0.16em] transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Joining..." : "Join"}
              </button>
            </div>

            {successMessage ? (
              <p className="mt-3 text-xs text-white/70">{successMessage}</p>
            ) : null}

            {errorMessage ? (
              <p className="mt-3 text-xs text-red-400">{errorMessage}</p>
            ) : null}
          </div>
        </div>

        <div className="lg:pt-20 pt-10">
          <span className="text-white/20">Copyrigth 2026 viisleepers</span>
          <span className="lg:ml-56 ml-[25%]">Credits</span>
        </div>
      </div>
    </div>
  )
}
