import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const ORDER_STATUSES = [
  "Pending",
  "Paid",
  "Processing",
  "Shipped",
  "Completed",
  "Cancelled",
]

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

function SummaryCard({ label, value, description }) {
  return (
    <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-6 shadow-xl">
      <h3 className="text-sm uppercase tracking-wider text-white/75">
        {label}
      </h3>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {description ? (
        <p className="mt-2 text-sm text-white/80">{description}</p>
      ) : null}
    </div>
  )
}

export default async function AdminPage() {
  const [
    productCount,
    totalOrders,
    pendingOrders,
    recentOrders,
    lowStockProducts,
    statusCounts,
    totalRevenue,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "Pending" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.product.findMany({
      where: { stock: { lte: 5 } },
      orderBy: [{ stock: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        stock: true,
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: ["Completed", "Paid"] } },
      _sum: { total: true },
    }),
  ])

  const statusSummary = ORDER_STATUSES.reduce((acc, status) => {
    acc[status] = 0
    return acc
  }, {})

  statusCounts.forEach((entry) => {
    statusSummary[entry.status] = entry._count.status
  })

  return (
    <section className="space-y-8 text-white">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
        <p className="text-white/80">
          Real-time overview of orders, inventory, and revenue.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Revenue"
          value={formatRupiah(totalRevenue._sum.total ?? 0)}
          description="Completed and Paid orders"
        />
        <SummaryCard
          label="Total Orders"
          value={String(totalOrders)}
          description="All recorded orders"
        />
        <SummaryCard
          label="Total Products"
          value={String(productCount)}
          description="Active catalog items"
        />
        <SummaryCard
          label="Pending Orders"
          value={String(pendingOrders)}
          description="Requires fulfillment attention"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-white/50 bg-[#2f5a44] shadow-xl">
          <div className="border-b border-white/25 px-6 py-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-6 text-sm text-white/80">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/25">
                <thead className="bg-[#264b38] text-left text-xs uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-4 py-3">Order Number</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/15 bg-white text-sm text-black">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-3 font-semibold">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">{order.customerName}</td>
                      <td className="px-4 py-3">{formatRupiah(order.total)}</td>
                      <td className="px-4 py-3">{order.status}</td>
                      <td className="px-4 py-3">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-white/50 bg-[#2f5a44] shadow-xl">
            <div className="border-b border-white/25 px-6 py-4">
              <h2 className="text-xl font-semibold">Low Stock Products</h2>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="p-6 text-sm text-white/80">
                No low stock products found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/25">
                  <thead className="bg-[#264b38] text-left text-xs uppercase tracking-wider text-white">
                    <tr>
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/15 bg-white text-sm text-black">
                    {lowStockProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-4 py-3 font-semibold">
                          {product.name}
                        </td>
                        <td className="px-4 py-3">{product.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/50 bg-[#2f5a44] shadow-xl">
            <div className="border-b border-white/25 px-6 py-4">
              <h2 className="text-xl font-semibold">Order Status Summary</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-3">
              {ORDER_STATUSES.map((status) => (
                <div
                  key={status}
                  className="rounded-lg border border-white/20 bg-white p-4 text-black"
                >
                  <p className="text-xs uppercase tracking-wider text-black/60">
                    {status}
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {statusSummary[status]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
