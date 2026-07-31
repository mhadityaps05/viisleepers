import Link from "next/link"
import Navbar from "@/app/component/navbar/page"

export default async function CheckoutFailedPage({ searchParams }) {
  return (
    <div className="w-full bg-black relative z-10 p-10 font-benguiat overflow-hidden min-h-screen text-white">
      <Navbar />

      <main className="mx-auto max-w-4xl lg:pt-30 pt-20">
        <section className="rounded-2xl border border-white/20 p-8 md:p-12 space-y-6">
          <h1 className="text-4xl md:text-5xl">FAILED</h1>

          <div className="space-y-3 text-lg">
            <p>
              Unfortunately, we couldn't complete your payment. Please try again
              or choose a different payment method.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-xl border border-white px-6 py-3 text-sm tracking-wide transition hover:bg-white hover:text-black"
          >
            Continue Shopping
          </Link>
        </section>
      </main>
    </div>
  )
}
