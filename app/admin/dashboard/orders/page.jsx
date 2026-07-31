import Link from "next/link"
import { prisma } from "@/lib/prisma"
import OrdersTableLive from "./OrdersTableLive"

const PAGE_SIZE = 10

const PAYMENT_STATUSES = [
  "All",
  "Pending",
  "Paid",
  "Failed",
  "Expired",
  "Cancelled",
  "Refunded",
]

const ORDER_STATUSES = [
  "All",
  "Pending",
  "Processing",
  "Shipping",
  "Delivered",
  "Cancelled",
]

const SORT_OPTIONS = {
  newest: "Newest First",
  oldest: "Oldest First",
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function toPositiveInt(value, fallback = 1) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

function buildOrdersUrl(filters) {
  const params = new URLSearchParams()

  if (filters.q) {
    params.set("q", filters.q)
  }

  if (filters.payment && filters.payment !== "All") {
    params.set("payment", filters.payment)
  }

  if (filters.order && filters.order !== "All") {
    params.set("order", filters.order)
  }

  if (filters.sort && filters.sort !== "newest") {
    params.set("sort", filters.sort)
  }

  if (filters.page && Number(filters.page) > 1) {
    params.set("page", String(filters.page))
  }

  const query = params.toString()
  return query ? `/admin/dashboard/orders?${query}` : "/admin/dashboard/orders"
}

export default async function OrdersPage({ searchParams }) {
  const params = await searchParams

  const q = typeof params?.q === "string" ? params.q.trim() : ""
  const payment =
    typeof params?.payment === "string" &&
    PAYMENT_STATUSES.includes(params.payment)
      ? params.payment
      : "All"
  const order =
    typeof params?.order === "string" && ORDER_STATUSES.includes(params.order)
      ? params.order
      : "All"
  const sort =
    typeof params?.sort === "string" && Object.hasOwn(SORT_OPTIONS, params.sort)
      ? params.sort
      : "newest"

  const requestedPage = toPositiveInt(params?.page, 1)

  const whereClauses = []

  if (q) {
    whereClauses.push({
      OR: [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    })
  }

  if (payment !== "All") {
    whereClauses.push({ status: payment })
  }

  if (order !== "All") {
    whereClauses.push({ orderStatus: order })
  }

  const where = whereClauses.length > 0 ? { AND: whereClauses } : {}

  const totalCount = await prisma.order.count({ where })
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.min(requestedPage, totalPages)

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const baseFilters = { q, payment, order, sort }
  const hasFilters =
    q || payment !== "All" || order !== "All" || sort !== "newest"
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endItem = totalCount === 0 ? 0 : startItem + orders.length - 1

  const initialData = {
    orders,
    meta: {
      totalCount,
      totalPages,
      currentPage,
      startItem,
      endItem,
      pageSize: PAGE_SIZE,
      filters: {
        q,
        payment,
        order,
        sort,
      },
    },
  }

  return (
    <section className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Orders</h1>
      </div>

      <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-4 shadow-xl md:p-5">
        <form
          action="/admin/dashboard/orders"
          method="GET"
          className="flex flex-col gap-3 lg:flex-row lg:items-center"
        >
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search order number, customer name, or email"
            className="h-10 w-full rounded-md border border-white/40 bg-[#264b38] px-3 text-sm text-white placeholder:text-white/60 outline-none focus:border-white lg:flex-1"
          />

          <select
            name="payment"
            defaultValue={payment}
            className="h-10 w-full rounded-md border border-white/40 bg-[#264b38] px-3 text-sm text-white outline-none focus:border-white lg:w-44"
          >
            {PAYMENT_STATUSES.map((value) => (
              <option key={value} value={value} className="text-black">
                {value === "All" ? "Payment: All" : value}
              </option>
            ))}
          </select>

          <select
            name="order"
            defaultValue={order}
            className="h-10 w-full rounded-md border border-white/40 bg-[#264b38] px-3 text-sm text-white outline-none focus:border-white lg:w-44"
          >
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value} className="text-black">
                {value === "All" ? "Order: All" : value}
              </option>
            ))}
          </select>

          <select
            name="sort"
            defaultValue={sort}
            className="h-10 w-full rounded-md border border-white/40 bg-[#264b38] px-3 text-sm text-white outline-none focus:border-white lg:w-40"
          >
            {Object.entries(SORT_OPTIONS).map(([value, label]) => (
              <option key={value} value={value} className="text-black">
                {label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="h-10 rounded-md border border-white bg-white px-4 text-sm font-semibold text-[#3C6D53] transition hover:bg-green-100 lg:w-auto"
          >
            Apply
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {payment !== "All" ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-[#264b38] px-3 py-1 text-xs text-white">
              Payment: {payment}
              <Link
                href={buildOrdersUrl({
                  ...baseFilters,
                  payment: "All",
                  page: 1,
                })}
                className="rounded-full border border-white/35 px-1.5 text-[10px] leading-4 transition hover:border-white"
                aria-label="Remove payment filter"
              >
                X
              </Link>
            </span>
          ) : null}

          {order !== "All" ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-[#264b38] px-3 py-1 text-xs text-white">
              Order: {order}
              <Link
                href={buildOrdersUrl({ ...baseFilters, order: "All", page: 1 })}
                className="rounded-full border border-white/35 px-1.5 text-[10px] leading-4 transition hover:border-white"
                aria-label="Remove order filter"
              >
                X
              </Link>
            </span>
          ) : null}

          {hasFilters ? (
            <Link
              href="/admin/dashboard/orders"
              className="ml-auto inline-flex items-center rounded-md border border-white/40 px-3 py-1 text-xs text-white transition hover:border-white"
            >
              Clear Filters
            </Link>
          ) : null}
        </div>
      </div>

      <OrdersTableLive
        initialData={initialData}
        filters={{ ...baseFilters, page: currentPage }}
      />
    </section>
  )
}
