"use client"

import { useState } from "react"
import Link from "next/link"
import Navbar from "@/app/component/navbar/page"
import { useCart } from "@/lib/CartContext"
import { clearStockConflict, readStockConflict } from "@/lib/checkout-payment"

type StockConflictItem = {
  productId: string
  productName: string
  availableStock: number
  requestedQuantity: number
}

type StockConflictState = {
  title?: string
  message?: string
  items?: StockConflictItem[]
} | null

export default function CartPage() {
  const { cartItems, cartTotal, removeFromCart, updateQuantity } = useCart()
  const [stockConflict, setStockConflict] =
    useState<StockConflictState>(readStockConflict)

  const highlightedProductIds = new Set(
    Array.isArray(stockConflict?.items)
      ? stockConflict.items.map((item) => item.productId)
      : [],
  )

  const handleDismissStockConflict = () => {
    clearStockConflict()
    setStockConflict(null)
  }

  return (
    <div className="w-full bg-black relative z-10 p-10 font-benguiat overflow-hidden min-h-screen">
      <Navbar />

      {stockConflict ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-red-500/50 bg-black p-8 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <p className="text-sm uppercase tracking-[0.3em] text-red-400">
              {stockConflict.title || "Stock Updated"}
            </p>
            <h2 className="mt-4 text-3xl">Review Your Bag</h2>
            <p className="mt-4 text-base text-white/80">
              {stockConflict.message ||
                "Some items in your cart are no longer available in the requested quantity. Please review your cart before continuing."}
            </p>

            {Array.isArray(stockConflict.items) &&
            stockConflict.items.length > 0 ? (
              <div className="mt-6 space-y-3 rounded-xl border border-white/15 bg-white/5 p-4">
                {stockConflict.items.map((item) => (
                  <div
                    key={`${item.productId}-${item.requestedQuantity}`}
                    className="flex flex-col gap-1 text-sm text-white/75 md:flex-row md:items-center md:justify-between"
                  >
                    <span>{item.productName}</span>
                    <span>
                      Available: {item.availableStock} / Requested:{" "}
                      {item.requestedQuantity}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleDismissStockConflict}
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm tracking-wide text-black transition hover:bg-white/90"
            >
              Return to Cart
            </button>
          </div>
        </div>
      ) : null}

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
                    key={`${item.productId}-${item.size}`}
                    className={`rounded-lg border p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${
                      highlightedProductIds.has(item.productId)
                        ? "border-red-500 bg-red-500/10"
                        : "border-white/30"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div>
                        <h2 className="text-xl">{item.name}</h2>
                        <p className="text-white/80">Size: {item.size}</p>
                        <p className="text-white/80">
                          Rp.{item.price.toLocaleString("id-ID")}
                        </p>
                        <p className="text-white/80">
                          Subtotal: Rp.{subtotal.toLocaleString("id-ID")}
                        </p>
                        {stockConflict?.items?.find(
                          (conflict) => conflict.productId === item.productId,
                        ) ? (
                          <p className="mt-2 text-sm text-red-400">
                            Only{" "}
                            {
                              stockConflict.items.find(
                                (conflict) =>
                                  conflict.productId === item.productId,
                              )?.availableStock
                            }{" "}
                            item(s) currently available.
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.size,
                            item.quantity - 1,
                          )
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
                          updateQuantity(
                            item.productId,
                            item.size,
                            item.quantity + 1,
                          )
                        }
                        className="w-8 h-8 border border-white rounded hover:bg-white hover:text-black transition"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.productId, item.size)
                        }
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
              <Link
                type="button"
                href="/checkout"
                className="flex items-center h-11 px-6 border border-white rounded-lg text-white/70"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
