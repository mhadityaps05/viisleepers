import { unstable_noStore as noStore } from "next/cache"
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
  noStore()

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      productSizes: {
        select: {
          stock: true,
        },
      },
    },
  })

  return products.reduce<GroupedProducts>((acc, prod) => {
    const normalizedCategory = normalizeCategory(prod.category)

    if (!acc[normalizedCategory]) acc[normalizedCategory] = []

    const computedStock =
      prod.productSizes.length > 0
        ? prod.productSizes.reduce((sum, item) => sum + item.stock, 0)
        : prod.stock

    acc[normalizedCategory].push({
      id: prod.id,
      category: normalizedCategory,
      name: prod.name,
      price: prod.price,
      stock: computedStock,
      images: prod.images,
    })

    return acc
  }, {})
}
