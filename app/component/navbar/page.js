"use client"
import React from "react"
import Link from "next/link"
import { useCart } from "@/lib/CartContext"

export default function Navbar() {
  const { cartCount } = useCart()

  return (
    <nav className="font-benguiat font-bold fixed top-0 left-0 right-0 z-20 flex items-center justify-between h-16 md:h-[20%] px-6 py-10 md:px-[15%]">
      <Link href="/">
        <img
          src="/logo.svg"
          alt="Logo"
          className="lg:w-[50%] w-10 md:w-[5%] object-contain"
        />
      </Link>

      <div className="flex gap-10 text-xl lg:text-2xl">
        <Link href="/shop" className="text-white">
          Shop
        </Link>
        <Link href="/cart" className="text-white">
          Bag ({cartCount})
        </Link>
      </div>
    </nav>
  )
}
