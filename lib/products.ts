import { normalizeCategory } from "@/lib/category"
import { prisma } from "@/lib/prisma"

export type ProductItem = {
  id: string
  category: string
  name: string
  price: number
  stock: number
  images: string[]
}

export type GroupedProducts = Record<string, ProductItem[]>

export async function getGroupedProducts(): Promise<GroupedProducts> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
  })

  return products.reduce<GroupedProducts>((acc, prod) => {
    const normalizedCategory = normalizeCategory(prod.category)

    if (!acc[normalizedCategory]) acc[normalizedCategory] = []

    acc[normalizedCategory].push({
      id: prod.id,
      category: normalizedCategory,
      name: prod.name,
      price: prod.price,
      stock: prod.stock,
      images: prod.images,
    })

    return acc
  }, {})
}
