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
        }) => Promise<ProductDetail | null>
      }
    }
  ).product.findUnique({
    where: { id },
  })

  if (!product) {
    notFound()
  }

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
                product.stock > 0 ? "text-white/80" : "text-red-300"
              }`}
            >
              {product.stock > 0 ? `Stok: ${product.stock}` : "Stok habis"}
            </p>
          </div>
        </div>
        <div className="flex gap-5 mt-5 justify-center w-full">
          <AddToCartButton
            id={product.id}
            name={product.name}
            price={product.price}
            image={product.images[0] ?? "/logo.svg"}
            disabled={product.stock === 0}
          />
        </div>
      </div>
    </div>
  )
}
