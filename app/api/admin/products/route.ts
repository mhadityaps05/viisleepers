import { NextResponse } from "next/server"
import { normalizeCategory } from "@/lib/category"
import { prisma } from "@/lib/prisma"
import {
  deleteImageFiles,
  parseImageFiles,
  saveImageFiles,
} from "./upload-utils"

const MIN_PRODUCT_IMAGES = 3

function parsePositiveInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ products })
}

export async function POST(request: Request) {
  const formData = await request.formData()

  const name = formData.get("name")
  const category = formData.get("category")
  const price = parsePositiveInt(formData.get("price"))
  const stock = parsePositiveInt(formData.get("stock"))
  const imageFiles = parseImageFiles(formData)

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ message: "Name is required." }, { status: 400 })
  }

  if (typeof category !== "string" || !category.trim()) {
    return NextResponse.json(
      { message: "Category is required." },
      { status: 400 },
    )
  }

  const normalizedCategory = normalizeCategory(category)

  if (price === null) {
    return NextResponse.json(
      { message: "Price must be a non-negative integer." },
      { status: 400 },
    )
  }

  if (stock === null) {
    return NextResponse.json(
      { message: "Stock must be a non-negative integer." },
      { status: 400 },
    )
  }

  if (imageFiles.length < MIN_PRODUCT_IMAGES) {
    return NextResponse.json(
      { message: "Minimal 3 foto produk diperlukan" },
      { status: 400 },
    )
  }

  let savedImages: string[] = []

  try {
    savedImages = await saveImageFiles(imageFiles)

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        category: normalizedCategory,
        price,
        stock,
        images: savedImages,
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    if (savedImages.length) {
      await deleteImageFiles(savedImages)
    }

    const message =
      error instanceof Error ? error.message : "Failed to create product."
    return NextResponse.json({ message }, { status: 400 })
  }
}
