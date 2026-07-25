import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ProductForm from "../../ProductForm"

type EditProductPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
  })

  if (!product) {
    notFound()
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Edit Product</h1>
      </div>

      <ProductForm
        mode="edit"
        productId={product.id}
        initialData={{
          name: product.name,
          category: product.category,
          price: product.price,
          stock: product.stock,
          images: product.images,
        }}
      />
    </section>
  )
}
