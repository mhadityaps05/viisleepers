"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/CartContext"

type AddToCartButtonProps = {
  productId: string
  name: string
  price: number
  image: string
  disabled?: boolean
}

export default function AddToCartButton({
  productId,
  name,
  price,
  image,
  disabled = false,
}: AddToCartButtonProps) {
  const { addToCart } = useCart()
  const router = useRouter()
  const [size, setSize] = useState("")

  const isSizeMissing = size.length === 0
  const isDisabled = disabled || isSizeMissing

  const handleAdd = () => {
    if (isDisabled) {
      return
    }

    addToCart({ productId, name, price, image, size })
    router.push("/cart")
  }

  return (
    <div className="w-full flex flex-col gap-3">
      <label className="text-white/80 text-sm" htmlFor="product-size">
        Size *
      </label>
      <select
        id="product-size"
        value={size}
        onChange={(event) => setSize(event.target.value)}
        disabled={disabled}
        className="w-full h-10 border border-white/70 bg-black text-white rounded-lg px-3 outline-none disabled:cursor-not-allowed disabled:border-white/30 disabled:text-white/40"
      >
        <option value="" className="text-black">
          Select size
        </option>
        <option value="S" className="text-black">
          S
        </option>
        <option value="M" className="text-black">
          M
        </option>
        <option value="L" className="text-black">
          L
        </option>
        <option value="XL" className="text-black">
          XL
        </option>
      </select>

      <button
        type="button"
        onClick={handleAdd}
        disabled={isDisabled}
        className="w-full h-10 border border-white text-white rounded-lg hover:bg-white hover:text-black transition disabled:cursor-not-allowed disabled:border-white/30 disabled:text-white/40 disabled:hover:bg-transparent disabled:hover:text-white/40"
      >
        {disabled ? "Stok Habis" : "Add to Cart"}
      </button>
    </div>
  )
}
