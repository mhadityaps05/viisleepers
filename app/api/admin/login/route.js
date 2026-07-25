import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req) {
  const { username, password } = await req.json()

  const admin = await prisma.admin.findUnique({
    where: {
      username,
    },
  })

  if (!admin) {
    return NextResponse.json({ message: "Username salah" }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, admin.password)

  if (!valid) {
    return NextResponse.json({ message: "Password salah" }, { status: 401 })
  }

  const token = await createToken({
    id: admin.id,
    username: admin.username,
  })

  const cookieStore = await cookies()

  cookieStore.set("admin-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  return NextResponse.json({
    success: true,
  })
}
