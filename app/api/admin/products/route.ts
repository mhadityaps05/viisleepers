import { NextRequest, NextResponse } from "next/server"
import { normalizeCategory } from "@/lib/category"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
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

type ProductSizeInput = {
  sizeId: string
  stock: number
}

function parseProductSizes(
  value: FormDataEntryValue | null,
): ProductSizeInput[] | null {
  if (typeof value !== "string" || !value.trim()) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) {
      return null
    }

    const normalized = parsed
      .map((item) => {
        const sizeId =
          typeof item?.sizeId === "string" ? item.sizeId.trim() : ""
        const stock = Number(item?.stock)

        if (!sizeId || !Number.isInteger(stock) || stock < 0) {
          return null
        }

        return {
          sizeId,
          stock,
        }
      })
      .filter((item): item is ProductSizeInput => item !== null)

    if (normalized.length === 0 || normalized.length !== parsed.length) {
      return null
    }

    const uniqueSizeIds = new Set(normalized.map((item) => item.sizeId))
    if (uniqueSizeIds.size !== normalized.length) {
      return null
    }

    return normalized
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      productSizes: {
        include: {
          size: true,
        },
      },
    },
  })

  return NextResponse.json({ products })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()

  const name = formData.get("name")
  const category = formData.get("category")
  const price = parsePositiveInt(formData.get("price"))
  const productSizes = parseProductSizes(formData.get("productSizes"))
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

  if (!productSizes) {
    return NextResponse.json(
      {
        message: "At least one valid size with non-negative stock is required.",
      },
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

    const sizeIds = productSizes.map((item) => item.sizeId)
    const validSizes = await prisma.size.findMany({
      where: {
        id: {
          in: sizeIds,
        },
      },
      select: { id: true },
    })

    if (validSizes.length !== sizeIds.length) {
      throw new Error("One or more selected sizes no longer exist.")
    }

    const totalStock = productSizes.reduce((sum, item) => sum + item.stock, 0)

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        category: normalizedCategory,
        price,
        stock: totalStock,
        images: savedImages,
        productSizes: {
          createMany: {
            data: productSizes,
          },
        },
      },
      include: {
        productSizes: {
          include: {
            size: true,
          },
        },
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
