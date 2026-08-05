import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function isUniqueConstraintError(error) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  )
}

export async function POST(request) {
  try {
    const body = await request.json()
    const email = normalizeEmail(body?.email)

    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 },
      )
    }

    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingSubscriber) {
      return NextResponse.json(
        {
          success: false,
          message: "This email is already subscribed.",
        },
        { status: 409 },
      )
    }

    const subscriber = await prisma.newsletterSubscriber.create({
      data: { email },
      select: {
        id: true,
        email: true,
        subscribedAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Successfully subscribed to the newsletter.",
        subscriber,
      },
      { status: 201 },
    )
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "This email is already subscribed.",
        },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to subscribe. Please try again.",
      },
      { status: 500 },
    )
  }
}
