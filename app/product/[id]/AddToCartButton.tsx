"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/CartContext"

type AddToCartButtonProps = {
  productId: string
  name: string
  price: number
  image: string
  sizeOptions: Array<{
    value: string
    stock: number
    selectable: boolean
  }>
  disabled?: boolean
}

export default function AddToCartButton({
  productId,
  name,
  price,
  image,
  sizeOptions,
  disabled = false,
}: AddToCartButtonProps) {
  const { addToCart } = useCart()
  const router = useRouter()
  const [size, setSize] = useState("")

  const selectableSizes = sizeOptions.filter(
    (option) => option.selectable && option.stock > 0,
  )

  const isSizeMissing = size.length === 0
  const isDisabled = disabled || isSizeMissing || selectableSizes.length === 0

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
        {sizeOptions.map((option) => {
          const isOutOfStock = option.stock <= 0
          const isSelectable = option.selectable && !isOutOfStock

          return (
            <option
              key={option.value}
              value={option.value}
              disabled={!isSelectable}
              className="text-black"
            >
              {option.value}
              {isOutOfStock ? " (Out of stock)" : ""}
              {!option.selectable ? " (Disabled)" : ""}
            </option>
          )
        })}
      </select>

      <button
        type="button"
        onClick={handleAdd}
        disabled={isDisabled}
        className="w-full h-10 border border-white text-white rounded-lg hover:bg-white hover:text-black transition disabled:cursor-not-allowed disabled:border-white/30 disabled:text-white/40 disabled:hover:bg-transparent disabled:hover:text-white/40"
      >
        {disabled || selectableSizes.length === 0
          ? "Stok Habis"
          : "Add to Cart"}
      </button>
    </div>
  )
}
