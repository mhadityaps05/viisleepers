import { prisma } from "../lib/prisma"
import { normalizeCategory } from "../lib/category"

async function main() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
  })

  let updatedCount = 0

  for (const product of products) {
    const normalizedCategory = normalizeCategory(product.category)

    if (product.category !== normalizedCategory) {
      await prisma.product.update({
        where: { id: product.id },
        data: { category: normalizedCategory },
      })

      updatedCount += 1
      console.log(
        `[updated] ${product.id}: "${product.category}" -> "${normalizedCategory}"`,
      )
    }
  }

  console.log(`Done. Updated ${updatedCount} product(s).`)
}

main()
  .catch((error) => {
    console.error("Failed to normalize categories:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
