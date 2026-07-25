import React from "react"
import Link from "next/link"
import Navbar from "@/app/component/navbar/page"
import ShopSection from "./ShopSection"
import { getGroupedProducts } from "@/lib/products"

export default async function shop() {
  const groupedProducts = await getGroupedProducts()

  return (
    <div className="w-full bg-black relative z-10 min-h-screen font-benguiat overflow-hidden">
      <div className="pb-10 lg:pb-30">
        <Navbar />
      </div>

      <ShopSection groupedProducts={groupedProducts} />
    </div>
  )
}
