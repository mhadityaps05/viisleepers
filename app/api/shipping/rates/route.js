import { NextResponse } from "next/server"

const DEFAULT_BITESHIP_BASE_URL = "https://api.biteship.com/v1"

function getBiteshipBaseUrl() {
  return (process.env.BITESHIP_BASE_URL || DEFAULT_BITESHIP_BASE_URL).replace(
    /\/+$/,
    "",
  )
}

function buildRatesUrl() {
  const baseUrl = getBiteshipBaseUrl()

  if (baseUrl.endsWith("/v1")) {
    return `${baseUrl}/rates/couriers`
  }

  return `${baseUrl}/v1/rates/couriers`
}

async function safeParseJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map((item) => ({
      name: typeof item?.name === "string" ? item.name.trim() : "",
      weight: Number(item?.weight),
      quantity: Number(item?.quantity),
    }))
    .filter(
      (item) =>
        item.name &&
        Number.isFinite(item.weight) &&
        item.weight > 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    )
}

export async function POST(request) {
  let body

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid JSON request body.",
      },
      { status: 400 },
    )
  }

  const apiKey = process.env.BITESHIP_API_KEY || ""
  const originAreaId = String(process.env.BITESHIP_ORIGIN_AREA_ID || "").trim()
  const destinationAreaId = String(body?.destination_area_id || "").trim()
  const items = normalizeItems(body?.items)

  if (!apiKey || !originAreaId) {
    console.error("[BITESHIP]", {
      url: request?.nextUrl?.toString(),
      hasApiKey: Boolean(apiKey),
      hasOriginAreaId: Boolean(originAreaId),
      error: "Missing Biteship server configuration.",
    })

    return NextResponse.json(
      {
        success: false,
        message: "Biteship configuration is incomplete.",
      },
      { status: 500 },
    )
  }

  if (!destinationAreaId || items.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message:
          "destination_area_id is required and items must contain at least one valid item.",
      },
      { status: 400 },
    )
  }

  const url = buildRatesUrl()
  const payload = {
    origin_area_id: originAreaId,
    destination_area_id: destinationAreaId,
    couriers: "jne,jnt,sicepat",
    items,
  }

  try {
    console.log("[BITESHIP]", {
      url,
      destination_area_id: destinationAreaId,
      item_count: items.length,
    })

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const biteshipResponse = await safeParseJson(response)

    console.log("[BITESHIP]", {
      url,
      status: response.status,
      payload: biteshipResponse,
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch shipping rates.",
          error: biteshipResponse,
        },
        { status: response.status },
      )
    }

    return NextResponse.json(biteshipResponse || {}, {
      status: response.status,
    })
  } catch (error) {
    console.error("[BITESHIP]", {
      url,
      error: error instanceof Error ? error.message : String(error),
      hasApiKey: Boolean(apiKey),
      hasOriginAreaId: Boolean(originAreaId),
    })

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch shipping rates.",
      },
      { status: 500 },
    )
  }
}
