import { NextResponse } from "next/server"
import { searchAreas } from "@/lib/biteship"

export async function GET(request) {
  const input = request.nextUrl.searchParams.get("input") || ""

  if (!input.trim()) {
    return NextResponse.json(
      {
        success: false,
        message: "input is required.",
      },
      { status: 400 },
    )
  }

  try {
    const areas = await searchAreas(input)

    return NextResponse.json({
      success: true,
      data: areas,
    })
  } catch (error) {
    console.error("[BITESHIP]", {
      url: request?.nextUrl?.toString(),
      error: error instanceof Error ? error.message : String(error),
      hasApiKey: Boolean(process.env.BITESHIP_API_KEY),
    })

    return NextResponse.json(
      {
        success: false,
        message: "Failed to search areas.",
      },
      { status: 500 },
    )
  }
}
