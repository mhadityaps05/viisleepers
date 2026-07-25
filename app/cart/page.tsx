"use client"

import Link from "next/link"
import Navbar from "@/app/component/navbar/page"
import { useCart } from "@/lib/CartContext"

export default function CartPage() {
  const { cartItems, cartTotal, removeFromCart, updateQuantity } = useCart()

  return (
    <div className="w-full bg-black relative z-10 p-10 font-benguiat overflow-hidden min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-6xl lg:pt-30 pt-20 text-white">
        <h1 className="text-4xl mb-8">Bag</h1>

        {cartItems.length === 0 ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
            <p className="text-2xl">Keranjang kamu masih kosong</p>
            <Link
              href="/shop"
              className="border border-white rounded-lg px-5 py-2 hover:bg-white hover:text-black transition"
            >
              Lihat Produk
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {cartItems.map((item) => {
                const subtotal = item.price * item.quantity

                return (
                  <div
                    key={item.id}
                    className="border border-white/30 rounded-lg p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div>
                        <h2 className="text-xl">{item.name}</h2>
                        <p className="text-white/80">
                          Rp.{item.price.toLocaleString("id-ID")}
                        </p>
                        <p className="text-white/80">
                          Subtotal: Rp.{subtotal.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-8 h-8 border border-white rounded hover:bg-white hover:text-black transition"
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-8 h-8 border border-white rounded hover:bg-white hover:text-black transition"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 border border-white/70 rounded px-3 py-1 hover:bg-white hover:text-black transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-white/30 pt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-2xl">
                Total: Rp.{cartTotal.toLocaleString("id-ID")}
              </p>
              <button
                type="button"
                disabled
                className="h-11 px-6 border border-white rounded-lg text-white/70 cursor-not-allowed"
              >
                Checkout (Soon)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
