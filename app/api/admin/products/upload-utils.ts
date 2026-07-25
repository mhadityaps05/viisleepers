import { randomUUID } from "crypto"
import path from "path"
import { supabaseAdmin } from "@/lib/supabase-admin"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
}

const STORAGE_BUCKET = "products"

function extractStoragePath(imagePath: string): string | null {
  try {
    const url = new URL(imagePath)
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
    const markerIndex = url.pathname.indexOf(marker)

    if (markerIndex === -1) {
      return null
    }

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}

function normalizeExtension(file: File): string {
  const originalExtension = path.extname(file.name).toLowerCase()
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(originalExtension)) {
    return originalExtension === ".jpeg" ? ".jpg" : originalExtension
  }

  return MIME_EXTENSION[file.type] ?? ".jpg"
}

export function getImageValidationError(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return `Unsupported file type for ${file.name}. Only jpg, jpeg, png, and webp are allowed.`
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File ${file.name} exceeds 5MB size limit.`
  }

  return null
}

export async function saveImageFiles(files: File[]): Promise<string[]> {
  if (!files.length) {
    return []
  }

  const imagePaths: string[] = []

  for (const file of files) {
    const error = getImageValidationError(file)
    if (error) {
      throw new Error(error)
    }

    const extension = normalizeExtension(file)
    const fileName = `${randomUUID()}${extension}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(fileName)

    imagePaths.push(publicUrl)
  }

  return imagePaths
}

export async function deleteImageFiles(imagePaths: string[]): Promise<void> {
  if (!imagePaths.length) {
    return
  }

  const fileNames = imagePaths
    .map((imagePath) => extractStoragePath(imagePath))
    .filter((imagePath): imagePath is string => Boolean(imagePath))

  if (!fileNames.length) {
    return
  }

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove(fileNames)

  if (error) {
    const missingFileError =
      error.message.toLowerCase().includes("not found") ||
      error.message.toLowerCase().includes("no such")

    if (!missingFileError) {
      throw new Error(error.message)
    }
  }
}

export function parseImageFiles(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
}
