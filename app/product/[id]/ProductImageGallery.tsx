"use client"

import { useState } from "react"

type ProductImageGalleryProps = {
  images: string[]
  name: string
}

export default function ProductImageGallery({
  images,
  name,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="w-full rounded border border-white/20 bg-black/30 p-8 text-center text-white/80">
        Tidak ada gambar produk
      </div>
    )
  }

  const selectedImage = images[selectedIndex]

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden rounded border border-white/20 bg-black/40">
        <img
          src={selectedImage}
          alt={`${name} image ${selectedIndex + 1}`}
          className="h-[420px] w-full object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`overflow-hidden rounded border ${
                selectedIndex === index
                  ? "border-white"
                  : "border-white/30 hover:border-white/70"
              }`}
              aria-label={`Pilih gambar ${index + 1}`}
            >
              <img
                src={image}
                alt={`${name} thumbnail ${index + 1}`}
                className="h-20 w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
