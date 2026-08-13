"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react"

const MIN_PRODUCT_IMAGES = 3

type ProductFormMode = "create" | "edit"

type ProductFormProps = {
  mode: ProductFormMode
  productId?: string
  initialData?: {
    name: string
    category: string
    price: number
    images: string[]
    productSizes: Array<{
      sizeId: string
      stock: number
      sizeValue: string
    }>
  }
}

type SizeOption = {
  id: string
  value: string
  active: boolean
}

type ProductSizeRow = {
  sizeId: string
  stock: string
}

export default function ProductForm({
  mode,
  productId,
  initialData,
}: ProductFormProps) {
  const [name, setName] = useState(initialData?.name ?? "")
  const [category, setCategory] = useState(initialData?.category ?? "")
  const [price, setPrice] = useState(String(initialData?.price ?? 0))
  const [sizeCatalog, setSizeCatalog] = useState<SizeOption[]>([])
  const [productSizes, setProductSizes] = useState<ProductSizeRow[]>(
    initialData?.productSizes?.map((entry) => ({
      sizeId: entry.sizeId,
      stock: String(entry.stock),
    })) ?? [{ sizeId: "", stock: "0" }],
  )
  const [existingImages, setExistingImages] = useState<string[]>(
    initialData?.images ?? [],
  )
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [error, setError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()
  const totalImageCount = existingImages.length + newImageFiles.length
  const imageCountError =
    totalImageCount < MIN_PRODUCT_IMAGES
      ? "Minimal 3 foto produk diperlukan"
      : ""

  const previewUrls = useMemo(
    () => newImageFiles.map((file) => URL.createObjectURL(file)),
    [newImageFiles],
  )

  useEffect(() => {
    return () => {
      previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl))
    }
  }, [previewUrls])

  useEffect(() => {
    let isCancelled = false

    const loadSizes = async () => {
      try {
        const response = await fetch("/api/admin/sizes", { cache: "no-store" })
        const payload = (await response.json().catch(() => ({}))) as {
          sizes?: SizeOption[]
        }

        if (!response.ok) {
          throw new Error("Failed to load size options.")
        }

        if (!isCancelled) {
          setSizeCatalog(Array.isArray(payload?.sizes) ? payload.sizes : [])
        }
      } catch {
        if (!isCancelled) {
          setSizeCatalog([])
        }
      }
    }

    loadSizes()

    return () => {
      isCancelled = true
    }
  }, [])

  const updateProductSizeRow = (
    index: number,
    key: keyof ProductSizeRow,
    value: string,
  ) => {
    setProductSizes((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    )
  }

  const addProductSizeRow = () => {
    setProductSizes((current) => [...current, { sizeId: "", stock: "0" }])
  }

  const removeProductSizeRow = (index: number) => {
    setProductSizes((current) => {
      const next = current.filter((_, rowIndex) => rowIndex !== index)
      return next.length > 0 ? next : [{ sizeId: "", stock: "0" }]
    })
  }

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) {
      return
    }

    setNewImageFiles((current) => [...current, ...files])
    event.target.value = ""
  }

  const removeNewImage = (index: number) => {
    setNewImageFiles((current) => current.filter((_, idx) => idx !== index))
  }

  const removeExistingImage = (path: string) => {
    setExistingImages((current) => current.filter((image) => image !== path))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (!name.trim() || !category.trim()) {
      setError("Name and category are required.")
      return
    }

    if (!/^\d+$/.test(price)) {
      setError("Price must be a non-negative integer.")
      return
    }

    const normalizedProductSizes = productSizes
      .map((row) => ({
        sizeId: row.sizeId.trim(),
        stock: row.stock.trim(),
      }))
      .filter((row) => row.sizeId || row.stock)

    if (normalizedProductSizes.length === 0) {
      setError("At least one size with stock is required.")
      return
    }

    const parsedProductSizes = normalizedProductSizes.map((row) => ({
      sizeId: row.sizeId,
      stock: Number(row.stock),
    }))

    if (
      parsedProductSizes.some(
        (row) =>
          !row.sizeId || !Number.isInteger(row.stock) || Number(row.stock) < 0,
      )
    ) {
      setError("Each size must have a non-negative integer stock.")
      return
    }

    const uniqueSizeIds = new Set(parsedProductSizes.map((row) => row.sizeId))

    if (uniqueSizeIds.size !== parsedProductSizes.length) {
      setError("Duplicate sizes are not allowed for a product.")
      return
    }

    if (imageCountError) {
      setError(imageCountError)
      return
    }

    const formData = new FormData()
    formData.append("name", name.trim())
    formData.append("category", category.trim())
    formData.append("price", price)
    formData.append("productSizes", JSON.stringify(parsedProductSizes))

    if (mode === "edit") {
      formData.append("keepImages", JSON.stringify(existingImages))
    }

    newImageFiles.forEach((file) => {
      formData.append("images", file)
    })

    setIsSubmitting(true)

    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${productId}`
      const method = mode === "create" ? "POST" : "PUT"

      const response = await fetch(endpoint, {
        method,
        body: formData,
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string
        } | null
        throw new Error(body?.message ?? "Failed to save product.")
      }

      router.push("/admin/dashboard/products")
      router.refresh()
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to save product."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/50 bg-[#2f5a44] p-6 text-white shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Product name"
              className="rounded-md border border-white/60 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-green-700"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            Category
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Category"
              className="rounded-md border border-white/60 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-green-700"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            Price (integer)
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              inputMode="numeric"
              placeholder="120000"
              className="rounded-md border border-white/60 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-green-700"
            />
          </label>

          <div className="flex items-end">
            <p className="text-xs text-white/80">
              Stock is managed per size below.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Product Sizes & Stock</h3>
            <button
              type="button"
              onClick={addProductSizeRow}
              className="rounded border border-white/70 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white hover:text-black"
            >
              Add Size Row
            </button>
          </div>

          {sizeCatalog.length === 0 ? (
            <p className="rounded-md border border-yellow-300 bg-yellow-100 px-3 py-2 text-xs font-semibold text-yellow-900">
              No sizes available yet. Create sizes from the Sizes menu first.
            </p>
          ) : null}

          <div className="space-y-2">
            {productSizes.map((row, index) => (
              <div
                key={`${row.sizeId}-${index}`}
                className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
              >
                <select
                  value={row.sizeId}
                  onChange={(event) =>
                    updateProductSizeRow(index, "sizeId", event.target.value)
                  }
                  className="rounded-md border border-white/60 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-green-700"
                >
                  <option value="">Select size</option>
                  {sizeCatalog.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.value} {size.active ? "" : "(disabled)"}
                    </option>
                  ))}
                </select>

                <input
                  value={row.stock}
                  onChange={(event) =>
                    updateProductSizeRow(index, "stock", event.target.value)
                  }
                  inputMode="numeric"
                  min="0"
                  placeholder="Stock"
                  className="rounded-md border border-white/60 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-green-700"
                />

                <button
                  type="button"
                  onClick={() => removeProductSizeRow(index)}
                  className="rounded border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold">Upload Images</label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={onImageChange}
            className="block w-full rounded-md border border-white/60 bg-white px-3 py-2 text-sm text-black file:mr-4 file:rounded file:border-0 file:bg-[#3C6D53] file:px-4 file:py-2 file:text-white"
          />
          <p className="text-xs text-white/85">
            Allowed: jpg, jpeg, png, webp. Max 5MB per image.
          </p>
          <p className="text-xs text-white/85">
            Minimal {MIN_PRODUCT_IMAGES} foto produk diperlukan.
          </p>
        </div>

        {mode === "edit" && existingImages.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Current Images</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {existingImages.map((imagePath) => (
                <div
                  key={imagePath}
                  className="rounded-lg border border-white/40 bg-white p-2"
                >
                  <Image
                    src={imagePath}
                    alt="Current product"
                    width={220}
                    height={220}
                    className="h-28 w-full rounded object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(imagePath)}
                    className="mt-2 w-full rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {newImageFiles.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">New Images</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {newImageFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="rounded-lg border border-white/40 bg-white p-2"
                >
                  <Image
                    src={previewUrls[index]}
                    alt={file.name}
                    width={220}
                    height={220}
                    className="h-28 w-full rounded object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="mt-2 w-full rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {imageCountError || error ? (
          <div className="rounded-md border border-red-200 bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">
            {error || imageCountError}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || Boolean(imageCountError)}
            className="rounded-md border border-white bg-white px-4 py-2 text-sm font-semibold text-[#3C6D53] transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? mode === "create"
                ? "Creating..."
                : "Updating..."
              : mode === "create"
                ? "Create Product"
                : "Update Product"}
          </button>

          <Link
            href="/admin/dashboard/products"
            className="rounded-md border border-white px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-900"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
