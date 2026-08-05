export const CHECKOUT_DRAFT_STORAGE_KEY = "viisleepers-checkout-draft"
export const STOCK_CONFLICT_STORAGE_KEY = "viisleepers-stock-conflict"

const PAYMENT_ATTEMPT_STORAGE_PREFIX = "viisleepers-payment-attempt:"
const CHECKOUT_ATTEMPT_ID_PATTERN = /^[a-z0-9-]{16,128}$/i

export function createCheckoutAttemptId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function sanitizeCheckoutAttemptId(value) {
  return typeof value === "string" ? value.trim() : ""
}

export function isValidCheckoutAttemptId(value) {
  return CHECKOUT_ATTEMPT_ID_PATTERN.test(sanitizeCheckoutAttemptId(value))
}

export function getPaymentAttemptStorageKey(attemptId) {
  return `${PAYMENT_ATTEMPT_STORAGE_PREFIX}${sanitizeCheckoutAttemptId(attemptId)}`
}

export function buildOrderNumberFromAttemptId(attemptId) {
  const normalizedAttemptId = sanitizeCheckoutAttemptId(attemptId)
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 32)

  if (!normalizedAttemptId) {
    throw new Error("Invalid checkout attempt ID.")
  }

  return `VSS-${normalizedAttemptId}`
}

export function parseStoredJson(value) {
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

export function readStockConflict() {
  if (typeof window === "undefined") {
    return null
  }

  return parseStoredJson(sessionStorage.getItem(STOCK_CONFLICT_STORAGE_KEY))
}

export function writeStockConflict(payload) {
  if (typeof window === "undefined") {
    return
  }

  sessionStorage.setItem(STOCK_CONFLICT_STORAGE_KEY, JSON.stringify(payload))
}

export function clearStockConflict() {
  if (typeof window === "undefined") {
    return
  }

  sessionStorage.removeItem(STOCK_CONFLICT_STORAGE_KEY)
}
