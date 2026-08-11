import { NextResponse } from "next/server"
import { fetchShippingCost } from "@/lib/biteship"

const ALLOWED_COURIERS = new Set(["jne", "jnt", "sicepat", "anteraja"])

function normalizeLocationInput(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value !== "string") {
    return ""
  }

  return value.trim()
}

function toPositiveInteger(value) {
  const normalized = Number(value)

  if (!Number.isInteger(normalized) || normalized <= 0) {
    return null
  }

  return normalized
}

function normalizeCourier(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function mapSingleService(courier, costResults) {
  if (!Array.isArray(costResults) || costResults.length === 0) {
    throw new Error("No shipping service available.")
  }

  const firstCourierResult = costResults[0]
  const costValue = Number(
    firstCourierResult?.price ??
      firstCourierResult?.courier_price ??
      firstCourierResult?.amount,
  )

  if (!Number.isFinite(costValue)) {
    throw new Error("No shipping service cost available.")
  }

  const etdRaw = String(
    firstCourierResult?.duration ||
      firstCourierResult?.courier_duration ||
      firstCourierResult?.etd ||
      "",
  ).trim()
  const etd = etdRaw
    ? `${etdRaw} Business Days`
    : "Estimated delivery unavailable"

  return {
    courier,
    service:
      firstCourierResult?.courier_service_name ||
      firstCourierResult?.courier_type ||
      "Regular Service",
    code:
      firstCourierResult?.courier_service_code ||
      firstCourierResult?.courier_type ||
      "REG",
    description: firstCourierResult?.courier_description || "Standard Shipping",
    cost: costValue,
    etd,
  }
}

export async function POST(request) {
  let body

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON request body." },
      { status: 400 },
    )
  }

  const origin = normalizeLocationInput(body?.origin)
  const destination = normalizeLocationInput(body?.destination)
  const weight = toPositiveInteger(body?.weight)
  const courier = normalizeCourier(body?.courier)

  if (!origin || !destination || !weight || !ALLOWED_COURIERS.has(courier)) {
    return NextResponse.json(
      {
        success: false,
        message:
          "origin and destination are required, weight must be a positive integer, and courier must be one of: jne, jnt, sicepat, anteraja.",
      },
      { status: 400 },
    )
  }

  try {
    const costResults = await fetchShippingCost({
      origin,
      destination,
      weight,
      courier,
    })

    const service = mapSingleService(courier, costResults)

    return NextResponse.json({
      success: true,
      data: [service],
    })
  } catch (error) {
    console.error("[BITESHIP]", {
      error: error instanceof Error ? error.message : String(error),
      hasApiKey: Boolean(process.env.BITESHIP_API_KEY),
    })

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch shipping cost.",
      },
      { status: 500 },
    )
  }
}
