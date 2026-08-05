"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import Navbar from "@/app/component/navbar/page"
import { useCart } from "@/lib/CartContext"
import {
  CHECKOUT_DRAFT_STORAGE_KEY,
  getPaymentAttemptStorageKey,
  isValidCheckoutAttemptId,
  writeStockConflict,
} from "@/lib/checkout-payment"

function wait(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}

function parseStoredAttempt(value) {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value)

    if (!parsed || typeof parsed !== "object") {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export default function PreparingPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearCart } = useCart()
  const attemptId = searchParams.get("attempt") ?? ""
  const hasValidAttempt = isValidCheckoutAttemptId(attemptId)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSlow, setIsSlow] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const [isPreparing, setIsPreparing] = useState(hasValidAttempt)
  const inFlightRef = useRef(false)
  const processedAttemptRef = useRef(null)
  const clearCartRef = useRef(clearCart)
  const routerRef = useRef(router)

  useEffect(() => {
    clearCartRef.current = clearCart
  }, [clearCart])

  useEffect(() => {
    routerRef.current = router
  }, [router])

  useEffect(() => {
    if (!isPreparing) {
      return
    }

    window.history.pushState(
      { preparingPayment: true },
      "",
      window.location.href,
    )

    const handlePopState = () => {
      window.history.pushState(
        { preparingPayment: true },
        "",
        window.location.href,
      )
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [isPreparing])

  useEffect(() => {
    if (!hasValidAttempt) {
      return
    }

    if (processedAttemptRef.current === attemptId || inFlightRef.current) {
      return
    }

    processedAttemptRef.current = attemptId

    let isCancelled = false
    const slowTimer = setTimeout(() => {
      if (!isCancelled) {
        setIsSlow(true)
      }
    }, 5000)

    const preparePayment = async () => {
      inFlightRef.current = true
      setIsPreparing(true)
      setErrorMessage("")
      setIsSlow(false)

      try {
        const storageKey = getPaymentAttemptStorageKey(attemptId)
        const storedAttempt = parseStoredAttempt(
          sessionStorage.getItem(storageKey),
        )

        if (!storedAttempt) {
          throw new Error(
            "We couldn't find your pending payment details. Please return to checkout and try again.",
          )
        }

        if (storedAttempt.redirect_url) {
          clearCartRef.current()
          sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY)
          window.location.replace(storedAttempt.redirect_url)
          return
        }

        while (!isCancelled) {
          const response = await fetch("/api/payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(storedAttempt),
          })

          const payload = await response.json().catch(() => ({}))

          if (response.ok && payload?.redirect_url) {
            const nextStoredAttempt = {
              ...storedAttempt,
              status: "ready",
              token: payload.token,
              redirect_url: payload.redirect_url,
              preparedAt: Date.now(),
            }

            sessionStorage.setItem(
              storageKey,
              JSON.stringify(nextStoredAttempt),
            )
            sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY)
            clearCartRef.current()
            window.location.replace(payload.redirect_url)
            return
          }

          if (response.status === 202) {
            sessionStorage.setItem(
              storageKey,
              JSON.stringify({
                ...storedAttempt,
                status: "preparing",
                lastPolledAt: Date.now(),
              }),
            )

            await wait(1000)
            continue
          }

          if (response.status === 409 && Array.isArray(payload?.items)) {
            writeStockConflict({
              title: "Stock Updated",
              message:
                "Some items in your cart are no longer available in the requested quantity. Please review your cart before continuing.",
              items: payload.items,
              createdAt: Date.now(),
            })
            sessionStorage.removeItem(storageKey)
            routerRef.current.replace("/cart", { scroll: false })
            return
          }

          throw new Error(
            payload?.message || "We couldn't prepare your payment right now.",
          )
        }
      } catch (error) {
        if (isCancelled) {
          return
        }

        setIsPreparing(false)
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We couldn't prepare your payment right now.",
        )
      } finally {
        clearTimeout(slowTimer)
        inFlightRef.current = false
      }
    }

    preparePayment()

    return () => {
      isCancelled = true
      clearTimeout(slowTimer)
    }
  }, [attemptId, hasValidAttempt, retryNonce])

  const handleTryAgain = () => {
    processedAttemptRef.current = null
    inFlightRef.current = false
    setIsPreparing(true)
    setIsSlow(false)
    setErrorMessage("")
    setRetryNonce((previous) => previous + 1)
  }

  return (
    <div className="relative z-10 min-h-screen w-full bg-black font-benguiat text-white">
      <Navbar />

      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 pb-16 pt-28 md:px-10 lg:pt-36">
        <section className="w-full rounded-2xl border border-white/20 bg-black/90 p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur md:p-12">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/3">
            <span className="relative block h-12 w-12">
              <span className="absolute inset-0 rounded-full border-2 border-white/15" />
              <span className="absolute inset-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </span>
          </div>

          <h1 className="mt-8 text-4xl md:text-5xl">Preparing Your Payment</h1>
          <p className="mt-4 text-lg text-white/80">
            Please wait while we securely prepare your payment.
          </p>
          <p className="mt-3 text-sm uppercase tracking-[0.3em] text-white/45">
            Do not close this page. You will be redirected to our secure
            payment.
          </p>

          {isSlow ? (
            <p className="mt-8 rounded-xl border border-white/15 bg-white/3 px-5 py-4 text-sm text-white/75">
              This is taking a little longer than usual due to your network
              connection. Please keep this page open.
            </p>
          ) : null}

          {errorMessage ? (
            <div className="mt-8 rounded-xl border border-red-500/50 bg-red-500/10 p-6 text-left">
              <p className="text-lg text-white">
                We couldn&apos;t prepare your payment.
              </p>
              <p className="mt-3 text-sm text-white/75">{errorMessage}</p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm tracking-wide text-black transition hover:bg-white/90"
                >
                  Try Again
                </button>
                <Link
                  href="/checkout"
                  className="inline-flex items-center justify-center rounded-xl border border-white px-6 py-3 text-sm tracking-wide transition hover:bg-white hover:text-black"
                >
                  Return to Checkout
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-10 text-sm text-white/55">
              {hasValidAttempt
                ? "Securing your order details and creating your payment session."
                : "We couldn't find a valid payment session. Please return to checkout and try again."}
            </p>
          )}

          {errorMessage || !hasValidAttempt ? (
            <button
              type="button"
              onClick={() => router.replace("/checkout", { scroll: false })}
              className="mt-10 text-xs uppercase tracking-[0.3em] text-white/35 transition hover:text-white/60"
            >
              Return to checkout
            </button>
          ) : null}
        </section>
      </main>
    </div>
  )
}
