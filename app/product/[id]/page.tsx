import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Navbar from "@/app/component/navbar/page"
import ProductImageGallery from "./ProductImageGallery"
import AddToCartButton from "./AddToCartButton"

type ProductDetailPageProps = {
  params: Promise<{ id: string }>
}

type ProductDetail = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  images: string[]
  productSizes: Array<{
    stock: number
    size: {
      value: string
      active: boolean
    }
  }>
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params

  const product = await (
    prisma as unknown as {
      product: {
        findUnique: (args: {
          where: { id: string }
          include: {
            productSizes: {
              include: {
                size: true
              }
            }
          }
        }) => Promise<ProductDetail | null>
      }
    }
  ).product.findUnique({
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
    notFound()
  }

  const hasConfiguredSizes = product.productSizes.length > 0
  const sizeOptions = hasConfiguredSizes
    ? product.productSizes.map((entry) => ({
        value: entry.size.value,
        stock: entry.stock,
        selectable: entry.size.active,
      }))
    : [
        {
          value: "Default",
          stock: product.stock,
          selectable: true,
        },
      ]

  const totalStock = hasConfiguredSizes
    ? sizeOptions
        .filter((entry) => entry.selectable)
        .reduce((sum, entry) => sum + entry.stock, 0)
    : product.stock

  return (
    <div className="w-full bg-black relative z-10 p-10 font-benguiat overflow-hidden min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-6xl lg:pt-30 pt-20">
        <Link
          href="/"
          className="inline-block text-white/80 hover:text-white transition mb-6"
        >
          Back
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          <ProductImageGallery images={product.images} name={product.name} />

          <div className="text-white">
            <p className="text-sm uppercase tracking-widest text-white/70">
              {product.category}
            </p>
            <h1 className="mt-2 text-4xl leading-tight">{product.name}</h1>
            <p className="mt-2 text-2xl">
              Rp.{product.price.toLocaleString("id-ID")}
            </p>
            <p
              className={`mt-3 text-lg ${
                totalStock > 0 ? "text-white/80" : "text-red-300"
              }`}
            >
              {totalStock > 0 ? `Stok: ${totalStock}` : "Stok habis"}
            </p>
          </div>
        </div>
        <div className="flex gap-5 mt-5 justify-center w-full">
          <AddToCartButton
            productId={product.id}
            name={product.name}
            price={product.price}
            image={product.images[0] ?? "/logo.svg"}
            sizeOptions={sizeOptions}
            disabled={totalStock === 0}
          />
        </div>
      </div>
    </div>
  )
}
