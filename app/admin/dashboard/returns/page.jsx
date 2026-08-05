import Link from "next/link"
import { prisma } from "@/lib/prisma"
import ReturnStatusForm from "./ReturnStatusForm"

const PAGE_SIZE = 10
const STATUS_OPTIONS = ["All", "Pending", "Approved", "Rejected", "Completed"]

function toPositiveInt(value, fallback = 1) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

function buildReturnsUrl(filters) {
  const params = new URLSearchParams()

  if (filters.q) {
    params.set("q", filters.q)
  }

  if (filters.status && filters.status !== "All") {
    params.set("status", filters.status)
  }

  if (filters.page && Number(filters.page) > 1) {
    params.set("page", String(filters.page))
  }

  const query = params.toString()
  return query
    ? `/admin/dashboard/returns?${query}`
    : "/admin/dashboard/returns"
}

export default async function ReturnsPage({ searchParams }) {
  const params = await searchParams

  const q = typeof params?.q === "string" ? params.q.trim() : ""
  const status =
    typeof params?.status === "string" && STATUS_OPTIONS.includes(params.status)
      ? params.status
      : "All"
  const requestedPage = toPositiveInt(params?.page, 1)

  const whereClauses = []

  if (q) {
    whereClauses.push({
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { orderNumber: { contains: q, mode: "insensitive" } },
      ],
    })
  }

  if (status !== "All") {
    whereClauses.push({ status })
  }

  const where = whereClauses.length > 0 ? { AND: whereClauses } : {}

  const totalCount = await prisma.returnRequest.count({ where })
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.min(requestedPage, totalPages)

  const returnRequests = await prisma.returnRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      email: true,
      orderNumber: true,
      orderItems: true,
      status: true,
      createdAt: true,
    },
  })

  const hasFilters = q || status !== "All"

  return (
    <section className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Return Requests</h1>
      </div>

      <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-4 shadow-xl md:p-5">
        <form
          action="/admin/dashboard/returns"
          method="GET"
          className="flex flex-col gap-3 lg:flex-row lg:items-center"
        >
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by email or order number"
            className="h-10 w-full rounded-md border border-white/40 bg-[#264b38] px-3 text-sm text-white placeholder:text-white/60 outline-none focus:border-white lg:flex-1"
          />

          <select
            name="status"
            defaultValue={status}
            className="h-10 w-full rounded-md border border-white/40 bg-[#264b38] px-3 text-sm text-white outline-none focus:border-white lg:w-40"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option} className="text-black">
                {option === "All" ? "Status: All" : option}
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
          {hasFilters ? (
            <Link
              href="/admin/dashboard/returns"
              className="ml-auto inline-flex items-center rounded-md border border-white/40 px-3 py-1 text-xs text-white transition hover:border-white"
            >
              Clear Filters
            </Link>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/50 bg-[#2f5a44] shadow-xl">
        {returnRequests.length === 0 ? (
          <div className="p-6 text-sm text-white/80">
            No return requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/25">
              <thead className="bg-[#264b38] text-left text-xs uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Order Items</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/15 bg-white text-sm text-black">
                {returnRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 font-semibold">{request.email}</td>
                    <td className="px-4 py-3">{request.orderNumber}</td>
                    <td className="max-w-xs px-4 py-3">{request.orderItems}</td>
                    <td className="px-4 py-3">{request.status}</td>
                    <td className="px-4 py-3">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ReturnStatusForm
                        id={request.id}
                        initialStatus={request.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/50 bg-[#2f5a44] px-4 py-3 text-sm text-white">
        <span>
          Page {currentPage} of {totalPages}
        </span>

        <div className="flex items-center gap-2">
          <Link
            href={buildReturnsUrl({ q, status, page: currentPage - 1 })}
            className={`rounded border px-3 py-1 transition ${
              currentPage <= 1
                ? "pointer-events-none border-white/20 text-white/40"
                : "border-white/50 hover:border-white"
            }`}
          >
            Previous
          </Link>
          <Link
            href={buildReturnsUrl({ q, status, page: currentPage + 1 })}
            className={`rounded border px-3 py-1 transition ${
              currentPage >= totalPages
                ? "pointer-events-none border-white/20 text-white/40"
                : "border-white/50 hover:border-white"
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </section>
  )
}
