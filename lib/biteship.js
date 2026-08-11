import "server-only"

const DEFAULT_BITESHIP_BASE_URL = "https://api.biteship.com/v1"
const BITESHIP_BASE_URL = (
  process.env.BITESHIP_BASE_URL || DEFAULT_BITESHIP_BASE_URL
).replace(/\/+$/, "")

function getApiKey() {
  return process.env.BITESHIP_API_KEY || ""
}

function buildHeaders() {
  const apiKey = getApiKey()

  if (!apiKey) {
    throw new Error("Biteship API key is not configured.")
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }
}

function maskApiKey(value) {
  const apiKey = typeof value === "string" ? value : ""

  if (!apiKey) {
    return ""
  }

  if (apiKey.length <= 10) {
    return `${apiKey.slice(0, 2)}****${apiKey.slice(-2)}`
  }

  return `${apiKey.slice(0, 6)}********${apiKey.slice(-4)}`
}

export async function safeParseJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export function normalizeResponse(payload) {
  if (Array.isArray(payload?.areas)) {
    return payload.areas
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  if (Array.isArray(payload?.data?.areas)) {
    return payload.data.areas
  }

  if (Array.isArray(payload?.administrative_divisions)) {
    return payload.administrative_divisions
  }

  if (Array.isArray(payload?.pricing)) {
    return payload.pricing
  }

  if (Array.isArray(payload?.couriers)) {
    return payload.couriers
  }

  if (Array.isArray(payload?.results)) {
    return payload.results
  }

  if (Array.isArray(payload?.result)) {
    return payload.result
  }

  return []
}

function toProvinceName(item) {
  const candidates = [
    item?.province,
    item?.province_name,
    item?.provinceName,
    item?.administrative_division_level_1_name,
    item?.province?.name,
    item?.name,
  ]

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return ""
}

function toCityName(item) {
  const candidates = [
    item?.city_name,
    item?.cityName,
    item?.city,
    item?.label,
    item?.administrative_division_level_2_name,
    item?.name,
  ]

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return ""
}

function toAreaId(item) {
  const candidates = [
    item?.id,
    item?.area_id,
    item?.areaId,
    item?.destination_id,
    item?.destinationId,
  ]

  for (const value of candidates) {
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim()
    }
  }

  return ""
}

function toAreaName(item) {
  const candidates = [
    item?.name,
    item?.label,
    item?.district,
    item?.administrative_division_level_4_name,
    item?.administrative_division_level_3_name,
  ]

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return ""
}

function toDistrictName(item) {
  const candidates = [
    item?.district,
    item?.district_name,
    item?.administrative_division_level_3_name,
    item?.administrative_division_level_4_name,
  ]

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return ""
}

function toPostalCode(item) {
  const candidates = [
    item?.postal_code,
    item?.postalCode,
    item?.zip_code,
    item?.zipCode,
  ]

  for (const value of candidates) {
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim()
    }
  }

  return ""
}

function toNormalizedAreas(rawItems) {
  return rawItems
    .map((item) => ({
      id: toAreaId(item),
      name: toAreaName(item),
      postal_code: toPostalCode(item),
      province: toProvinceName(item),
      city: toCityName(item),
      district: toDistrictName(item),
    }))
    .filter((item) => item.id && item.name)
}

export async function requestBiteship(pathname, options = {}) {
  const endpoint = pathname.startsWith("/") ? pathname : `/${pathname}`
  const finalUrl = `${BITESHIP_BASE_URL}${endpoint}`
  const url = new URL(finalUrl)

  Object.entries(options.searchParams || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      url.searchParams.set(key, String(value).trim())
    }
  })

  const headers = buildHeaders()

  console.log({
    baseUrl: BITESHIP_BASE_URL,
    endpoint,
    finalUrl: url.toString(),
  })

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  })

  const payload = await safeParseJson(response)

  console.error("[BITESHIP]", {
    url: url.toString(),
    headers: {
      Authorization: `Bearer ${maskApiKey(getApiKey())}`,
      "Content-Type": headers["Content-Type"],
    },
    status: response.status,
    payload,
  })

  if (!response.ok) {
    throw new Error(`Biteship ${response.status}: ${JSON.stringify(payload)}`)
  }

  if (payload?.success === false) {
    throw new Error(`Biteship ${response.status}: ${JSON.stringify(payload)}`)
  }

  return payload || {}
}

async function fetchAreas(params = {}) {
  const payload = await requestBiteship("/maps/areas", {
    method: "GET",
    searchParams: {
      countries: "ID",
      type: "single",
      ...params,
    },
  })

  return normalizeResponse(payload)
}

export async function searchAreas(input) {
  const normalizedInput = typeof input === "string" ? input.trim() : ""

  if (!normalizedInput) {
    return []
  }

  try {
    const areas = await fetchAreas({
      input: normalizedInput,
    })

    return toNormalizedAreas(areas)
  } catch (error) {
    console.error("[BITESHIP]", {
      error: error instanceof Error ? error.message : String(error),
    })
    throw new Error("Failed to search areas.")
  }
}

function buildRateRequestBody({ origin, destination, weight, courier }) {
  const body = {
    couriers: courier,
    items: [
      {
        name: "Shipping Package",
        description: "Shipping Package",
        value: 0,
        quantity: 1,
        weight: Number(weight),
        length: 1,
        width: 1,
        height: 1,
      },
    ],
  }

  const originValue = String(origin).trim()
  const destinationValue = String(destination).trim()
  const numericPattern = /^\d+$/

  if (numericPattern.test(originValue)) {
    body.origin_area_id = originValue
  } else {
    body.origin_postal_code = originValue
  }

  if (numericPattern.test(destinationValue)) {
    body.destination_area_id = destinationValue
  } else {
    body.destination_postal_code = destinationValue
  }

  return body
}

export async function fetchShippingCost({
  origin,
  destination,
  weight,
  courier,
}) {
  try {
    const payload = await requestBiteship("/rates/couriers", {
      method: "POST",
      searchParams: {
        channel: "gudangio",
      },
      body: buildRateRequestBody({ origin, destination, weight, courier }),
    })

    const pricing = normalizeResponse(payload)

    if (pricing.length === 0) {
      throw new Error("Empty Biteship pricing response.")
    }

    return pricing
  } catch (error) {
    console.error("[BITESHIP]", {
      error: error instanceof Error ? error.message : String(error),
    })
    throw new Error("Failed to calculate shipping cost.")
  }
}
