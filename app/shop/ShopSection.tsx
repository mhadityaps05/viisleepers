import React from "react"
import Link from "next/link"
import { GroupedProducts } from "@/lib/products"
type ShopSectionProps = {
  groupedProducts: GroupedProducts
}

export default function ShopSection({ groupedProducts }: ShopSectionProps) {
  if (Object.keys(groupedProducts).length === 0) {
    return (
      <div className="w-full  bg-black relative z-10 p-10 font-benguiat overflow-hidden flex items-center justify-center min-h-[40vh]">
        <h2 className="text-2xl text-white">Belum ada produk</h2>
      </div>
    )
  }

  return (
    <div className="w-full  bg-black relative z-10 p-10 font-benguiat overflow-hidden">
      {Object.keys(groupedProducts).map((category, catIndex) => {
        const items = groupedProducts[category]
        return (
          <div
            key={category}
            id={category.toLowerCase()}
            className={catIndex > 0 ? "mt-10" : ""}
          >
            <h1 className="text-2xl">{category}</h1>

            <div className="w-full mt-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5">
                {items.map((item) => (
                  <Link
                    href={`/product/${item.id}`}
                    key={item.id}
                    id={`product-${item.id}`}
                  >
                    <button
                      type="button"
                      aria-label={`View ${item.name}`}
                      className="flex flex-col items-start text-left cursor-pointer focus:outline-none"
                    >
                      <img src={item.images[0]} alt={`${item.name} image`} />
                      <div className="mt-5 ml-5">
                        <h2>{item.name}</h2>
                        <h3>{`Rp.${item.price.toLocaleString("id-ID")}`}</h3>
                      </div>
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
