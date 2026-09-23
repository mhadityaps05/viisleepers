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

// Reuses the same Storage bucket as product images, namespaced under its
// own folder rather than a new bucket, since "products" is the only bucket
// already provisioned in Supabase for this project.
const STORAGE_BUCKET = "products"
const STORAGE_FOLDER = "events"

function extractStoragePath(posterUrl: string): string | null {
  try {
    const url = new URL(posterUrl)
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

export async function savePosterFile(file: File): Promise<string> {
  const error = getImageValidationError(file)
  if (error) {
    throw new Error(error)
  }

  const extension = normalizeExtension(file)
  const fileName = `${STORAGE_FOLDER}/${randomUUID()}${extension}`
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

  return publicUrl
}

export async function deletePosterFile(posterUrl: string): Promise<void> {
  const fileName = extractStoragePath(posterUrl)

  if (!fileName) {
    return
  }

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([fileName])

  if (error) {
    const missingFileError =
      error.message.toLowerCase().includes("not found") ||
      error.message.toLowerCase().includes("no such")

    if (!missingFileError) {
      throw new Error(error.message)
    }
  }
}

export function parsePosterFile(formData: FormData): File | null {
  const entry = formData.get("poster")
  return entry instanceof File && entry.size > 0 ? entry : null
}
