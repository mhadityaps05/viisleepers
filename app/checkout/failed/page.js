import Link from "next/link"
import Navbar from "@/app/component/navbar/page"

function formatRupiah(value) {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) {
    return "Rp.0"
  }

  return `Rp.${normalized.toLocaleString("id-ID")}`
}

export default async function CheckoutFailedPage({ searchParams }) {
  const params = await searchParams
  const orderNumber =
    typeof params?.orderNumber === "string" ? params.orderNumber : "-"
  const total = typeof params?.total === "string" ? params.total : "0"

  return (
    <div className="w-full bg-black relative z-10 p-10 font-benguiat overflow-hidden min-h-screen text-white">
      <Navbar />

      <main className="mx-auto max-w-4xl lg:pt-30 pt-20">
        <section className="rounded-2xl border border-white/20 p-8 md:p-12 space-y-6">
          <h1 className="text-4xl md:text-5xl">FAILED</h1>

          <div className="space-y-3 text-lg">
            <p>
              Order Number: <span className="text-white/80">{orderNumber}</span>
            </p>
            <p>
              Total:{" "}
              <span className="text-white/80">{formatRupiah(total)}</span>
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
