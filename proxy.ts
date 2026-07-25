import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
  throw new Error("JWT_SECRET is required for admin proxy authentication")
}
const secret = new TextEncoder().encode(jwtSecret)

const authFreePaths = new Set([
  "/admin",
  "/admin/",
  "/admin/login",
  "/admin/login/",
])

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get("admin-token")?.value

  if (authFreePaths.has(pathname)) {
    if (token) {
      try {
        await jwtVerify(token, secret)
        return NextResponse.redirect(new URL("/admin/dashboard", req.url))
      } catch {
        return NextResponse.next()
      }
    }
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL("/admin", req.url))
  }

  try {
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL("/admin", req.url))
  }
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
}
