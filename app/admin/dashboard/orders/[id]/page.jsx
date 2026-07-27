import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import StatusForm from "./StatusForm"

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

export default async function OrderDetailPage({ params }) {
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!order) {
    return (
      <section className="space-y-6 text-white">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Order Detail</h1>
          <Link
            href="/admin/dashboard/orders"
            className="rounded-md border border-white bg-white px-4 py-2 text-sm font-semibold text-[#3C6D53] transition hover:bg-green-100"
          >
            Back to Orders
          </Link>
        </div>

        <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-6 shadow-xl">
          <p className="text-white/90">Order not found.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Order Detail</h1>
        <Link
          href="/admin/dashboard/orders"
          className="rounded-md border border-white bg-white px-4 py-2 text-sm font-semibold text-[#3C6D53] transition hover:bg-green-100"
        >
          Back to Orders
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-6 shadow-xl">
            <div className="grid gap-2 text-sm md:grid-cols-3 md:text-base">
              <p>
                <span className="text-white/80">Order Number:</span>{" "}
                {order.orderNumber}
              </p>
              <p>
                <span className="text-white/80">Status:</span> {order.status}
              </p>
              <p>
                <span className="text-white/80">Created Date:</span>{" "}
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-6 shadow-xl space-y-3">
            <h2 className="text-xl font-semibold">Customer Information</h2>
            <p>
              <span className="text-white/80">Name:</span> {order.customerName}
            </p>
            <p>
              <span className="text-white/80">Email:</span> {order.email}
            </p>
            <p>
              <span className="text-white/80">Phone:</span> {order.phone}
            </p>
          </div>

          <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-6 shadow-xl space-y-3">
            <h2 className="text-xl font-semibold">Shipping Address</h2>
            <p>
              <span className="text-white/80">Province:</span> {order.province}
            </p>
            <p>
              <span className="text-white/80">City:</span> {order.city}
            </p>
            <p>
              <span className="text-white/80">Postal Code:</span>{" "}
              {order.postalCode}
            </p>
            <p>
              <span className="text-white/80">Full Address:</span>{" "}
              {order.address}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/50 bg-[#2f5a44] shadow-xl">
            <h2 className="border-b border-white/25 px-6 py-4 text-xl font-semibold">
              Products
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/25">
                <thead className="bg-[#264b38] text-left text-xs uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-4 py-3">Image</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Selected Size</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/15 bg-white text-sm text-black">
                  {order.orderItems.map((item) => {
                    const subtotal = item.priceAtPurchase * item.quantity

                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          {item.product.images[0] ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
                              width={64}
                              height={64}
                              className="h-14 w-14 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
                              No Image
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {item.product.name}
                        </td>
                        <td className="px-4 py-3">{item.size}</td>
                        <td className="px-4 py-3">
                          {formatRupiah(item.priceAtPurchase)}
                        </td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">{formatRupiah(subtotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-semibold">Order Summary</h2>
            <div className="space-y-2 text-sm md:text-base">
              <p className="flex items-center justify-between">
                <span className="text-white/80">Subtotal</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-white/80">Shipping Fee</span>
                <span>{formatRupiah(order.shippingFee)}</span>
              </p>
              <p className="flex items-center justify-between border-t border-white/25 pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatRupiah(order.total)}</span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-6 shadow-xl">
            <StatusForm initialStatus={order.status} orderId={order.id} />
          </div>
        </div>
      </div>
    </section>
  )
}
