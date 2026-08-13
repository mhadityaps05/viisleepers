import { NextResponse } from "next/server"
import { normalizeCategory } from "@/lib/category"
import { prisma } from "@/lib/prisma"
import {
  deleteImageFiles,
  parseImageFiles,
  saveImageFiles,
} from "../upload-utils"

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

function parseKeepImages(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || !value.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(value) as unknown
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
    ) {
      return parsed
    }
    return []
  } catch {
    return []
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      productSizes: {
        include: {
          size: true,
        },
      },
    },
  })
  if (!product) {
    return NextResponse.json({ message: "Product not found." }, { status: 404 })
  }

  return NextResponse.json({ product })
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  const existingProduct = await prisma.product.findUnique({ where: { id } })
  if (!existingProduct) {
    return NextResponse.json({ message: "Product not found." }, { status: 404 })
  }

  const formData = await request.formData()
  const name = formData.get("name")
  const category = formData.get("category")
  const price = parsePositiveInt(formData.get("price"))
  const productSizes = parseProductSizes(formData.get("productSizes"))
  const keepImages = parseKeepImages(formData.get("keepImages"))
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

  const safeKeepImages = keepImages.filter((image) =>
    existingProduct.images.includes(image),
  )

  if (safeKeepImages.length + imageFiles.length < MIN_PRODUCT_IMAGES) {
    return NextResponse.json(
      { message: "Minimal 3 foto produk diperlukan" },
      { status: 400 },
    )
  }

  const removedImages = existingProduct.images.filter(
    (image) => !safeKeepImages.includes(image),
  )

  let newImages: string[] = []

  try {
    newImages = await saveImageFiles(imageFiles)
    const mergedImages = [...safeKeepImages, ...newImages]
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

    const product = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name: name.trim(),
          category: normalizedCategory,
          price,
          stock: totalStock,
          images: mergedImages,
        },
      })

      await tx.productSize.deleteMany({
        where: { productId: id },
      })

      await tx.productSize.createMany({
        data: productSizes.map((item) => ({
          productId: id,
          sizeId: item.sizeId,
          stock: item.stock,
        })),
      })

      return updatedProduct
    })

    if (removedImages.length) {
      await deleteImageFiles(removedImages)
    }

    return NextResponse.json({ product })
  } catch (error) {
    if (newImages.length) {
      await deleteImageFiles(newImages)
    }

    const message =
      error instanceof Error ? error.message : "Failed to update product."
    return NextResponse.json({ message }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  const existingProduct = await prisma.product.findUnique({ where: { id } })
  if (!existingProduct) {
    return NextResponse.json({ message: "Product not found." }, { status: 404 })
  }

  await prisma.product.delete({ where: { id } })
  await deleteImageFiles(existingProduct.images)

  return NextResponse.json({ success: true })
}
