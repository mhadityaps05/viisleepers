"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import useSWR from "swr"

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
  }).format(new Date(value))
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

function createSignature(data) {
  return JSON.stringify({
    orders: data.orders,
    totalCount: data.meta.totalCount,
    totalPages: data.meta.totalPages,
    currentPage: data.meta.currentPage,
    startItem: data.meta.startItem,
    endItem: data.meta.endItem,
  })
}

function isSameOrderRow(a, b) {
  return (
    a.id === b.id &&
    a.orderNumber === b.orderNumber &&
    a.customerName === b.customerName &&
    a.total === b.total &&
    a.status === b.status &&
    a.orderStatus === b.orderStatus &&
    a.createdAt === b.createdAt
  )
}

function mergeOrdersWithStableRows(previousOrders, nextOrders) {
  const previousById = new Map(previousOrders.map((order) => [order.id, order]))

  return nextOrders.map((nextOrder) => {
    const previousOrder = previousById.get(nextOrder.id)

    if (previousOrder && isSameOrderRow(previousOrder, nextOrder)) {
      return previousOrder
    }

    return nextOrder
  })
}

function countNewOrders(previousOrders, nextOrders) {
  const previousIds = new Set(previousOrders.map((order) => order.id))
  return nextOrders.reduce(
    (count, order) => (previousIds.has(order.id) ? count : count + 1),
    0,
  )
}

const fetcher = async (url) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error("Failed to refresh orders.")
  }

  return response.json()
}

export default function OrdersTableLive({ initialData, filters }) {
  const pathname = usePathname()
  const initialPayload = useMemo(
    () => ({ orders: initialData.orders, meta: initialData.meta }),
    [initialData],
  )

  const [tableData, setTableData] = useState(initialPayload)
  const [toast, setToast] = useState(null)

  const signatureRef = useRef(createSignature(initialPayload))
  const tableDataRef = useRef(initialPayload)
  const toastTimerRef = useRef(null)

  const query = useMemo(() => {
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

    return params.toString()
  }, [filters])

  const apiUrl = query ? `/api/orders?${query}` : "/api/orders"

  useEffect(() => {
    tableDataRef.current = tableData
  }, [tableData])

  useEffect(() => {
    const nextSignature = createSignature(initialPayload)
    setTableData(initialPayload)
    signatureRef.current = nextSignature
  }, [initialPayload])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  useSWR(apiUrl, fetcher, {
    fallbackData: initialPayload,
    refreshInterval: pathname === "/admin/dashboard/orders" ? 15000 : 0,
    revalidateOnFocus: true,
    dedupingInterval: 10000,
    keepPreviousData: true,
    onSuccess: (data) => {
      const nextData = {
        orders: Array.isArray(data?.orders) ? data.orders : [],
        meta: data?.meta || initialPayload.meta,
      }
      const nextSignature = createSignature(nextData)

      if (nextSignature === signatureRef.current) {
        return
      }

      const previousData = tableDataRef.current
      const newOrderCount = countNewOrders(previousData.orders, nextData.orders)

      const mergedOrders = mergeOrdersWithStableRows(
        previousData.orders,
        nextData.orders,
      )

      const mergedData = {
        orders: mergedOrders,
        meta: nextData.meta,
      }

      setTableData(mergedData)
      tableDataRef.current = mergedData
      signatureRef.current = nextSignature

      if (newOrderCount > 0) {
        setToast({
          id: Date.now(),
          title: "New Order Received",
          description: `You have ${newOrderCount} new order(s).`,
        })

        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current)
        }

        toastTimerRef.current = setTimeout(() => {
          setToast(null)
        }, 5000)
      }
    },
  })

  const { orders, meta } = tableData

  return (
    <>
      {toast ? (
        <div className="fixed right-5 top-5 z-50 w-75 rounded-xl border border-white/40 bg-black/90 p-4 text-white shadow-2xl backdrop-blur">
          <p className="text-sm font-semibold">{toast.title}</p>
          <p className="mt-1 text-sm text-white/80">{toast.description}</p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-white/50 bg-[#2f5a44] shadow-xl">
        {orders.length === 0 ? (
          <div className="p-6 text-sm text-white/80">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/25">
              <thead className="bg-[#264b38] text-left text-xs uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3">Order Status</th>
                  <th className="px-4 py-3">Created At</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/15 bg-white text-sm text-black">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-semibold">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3">{formatRupiah(order.total)}</td>
                    <td className="px-4 py-3">{order.status}</td>
                    <td className="px-4 py-3">{order.orderStatus}</td>
                    <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Link
                          href={`/admin/dashboard/orders/${order.id}`}
                          className="rounded border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-white/40 bg-[#2f5a44] p-4 text-sm md:flex-row md:items-center md:justify-between">
        <p className="text-white/80">
          Showing {meta.startItem}-{meta.endItem} of {meta.totalCount} orders
        </p>

        <div className="flex items-center gap-2">
          <Link
            href={buildOrdersUrl({
              ...filters,
              page: Math.max(1, meta.currentPage - 1),
            })}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
              meta.currentPage > 1
                ? "border-white bg-white text-[#3C6D53] hover:bg-green-100"
                : "pointer-events-none border-white/30 text-white/40"
            }`}
          >
            Previous
          </Link>

          <span className="px-2 text-white/90">
            Page {meta.currentPage} / {meta.totalPages}
          </span>

          <Link
            href={buildOrdersUrl({
              ...filters,
              page: Math.min(meta.totalPages, meta.currentPage + 1),
            })}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
              meta.currentPage < meta.totalPages
                ? "border-white bg-white text-[#3C6D53] hover:bg-green-100"
                : "pointer-events-none border-white/30 text-white/40"
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </>
  )
}
