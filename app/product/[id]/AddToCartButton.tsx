"use client"

import { useRouter } from "next/navigation"
import { useCart } from "@/lib/CartContext"

type AddToCartButtonProps = {
  id: string
  name: string
  price: number
  image: string
  disabled?: boolean
}

export default function AddToCartButton({
  id,
  name,
  price,
  image,
  disabled = false,
}: AddToCartButtonProps) {
  const { addToCart } = useCart()
  const router = useRouter()

  const handleAdd = () => {
    if (disabled) {
      return
    }

    addToCart({ id, name, price, image })
    router.push("/cart")
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={disabled}
      className="w-full h-10 border border-white text-white rounded-lg hover:bg-white hover:text-black transition disabled:cursor-not-allowed disabled:border-white/30 disabled:text-white/40 disabled:hover:bg-transparent disabled:hover:text-white/40"
    >
      {disabled ? "Stok Habis" : "Add to Cart"}
    </button>
  )
}
