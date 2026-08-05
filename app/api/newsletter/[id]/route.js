import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(_request, { params }) {
  const { id } = await params

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { success: false, message: "Invalid subscriber ID." },
      { status: 400 },
    )
  }

  const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existingSubscriber) {
    return NextResponse.json(
      { success: false, message: "Subscriber not found." },
      { status: 404 },
    )
  }

  await prisma.newsletterSubscriber.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
