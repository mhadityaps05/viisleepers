import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import ProductDeleteButton from "./ProductDeleteButton"

type ProductListItem = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  images: string[]
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function ProductsPage() {
  const products = (await (
    prisma as unknown as {
      product: {
        findMany: (args: {
          orderBy: { createdAt: "desc" }
        }) => Promise<ProductListItem[]>
      }
    }
  ).product.findMany({
    orderBy: { createdAt: "desc" },
  })) as ProductListItem[]

  return (
    <section className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link
          href="/admin/dashboard/products/new"
          className="rounded-md border border-white bg-white px-4 py-2 text-sm font-semibold text-[#3C6D53] transition hover:bg-green-100"
        >
          Add Product
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/50 bg-[#2f5a44] shadow-xl">
        {products.length === 0 ? (
          <div className="p-6 text-sm text-white/80">
            No products yet. Click Add Product to create your first product.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/25">
              <thead className="bg-[#264b38] text-left text-xs uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/15 bg-white text-sm text-black">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={72}
                          height={72}
                          className="h-14 w-14 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold">{product.name}</td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3">{formatRupiah(product.price)}</td>
                    <td className="px-4 py-3">{product.stock}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/dashboard/products/${product.id}/edit`}
                          className="rounded border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                        >
                          Edit
                        </Link>
                        <ProductDeleteButton
                          id={product.id}
                          name={product.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
