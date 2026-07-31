"use client"

import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"

type ProductImageGalleryProps = {
  images: string[]
  name: string
}

export default function ProductImageGallery({
  images,
  name,
}: ProductImageGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 28 })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) {
      return
    }

    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) {
      return
    }

    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)

    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    setSelectedIndex(0)
    emblaApi?.scrollTo(0)
  }, [images, emblaApi])

  if (images.length === 0) {
    return (
      <div className="w-full rounded border border-white/20 bg-black/30 p-8 text-center text-white/80">
        Tidak ada gambar produk
      </div>
    )
  }

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()
  const scrollTo = (index: number) => emblaApi?.scrollTo(index)
  const canShowDesktopControls = images.length > 1

  const slides = images.map((src) => ({ src }))

  return (
    <div className="w-full">
      <div className="relative">
        <div
          ref={emblaRef}
          className="w-full overflow-hidden rounded border border-white/20 bg-black/40"
        >
          <div className="flex">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="min-w-0 shrink-0 grow-0 basis-full"
                aria-label={`Open ${name} image ${index + 1} in fullscreen`}
              >
                <img
                  src={image}
                  alt={`${name} image ${index + 1}`}
                  className="h-105 w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {canShowDesktopControls ? (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white transition hover:border-white hover:bg-black/80 md:flex"
              aria-label="Previous image"
            >
              <span aria-hidden="true">&#8249;</span>
            </button>

            <button
              type="button"
              onClick={scrollNext}
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white transition hover:border-white hover:bg-black/80 md:flex"
              aria-label="Next image"
            >
              <span aria-hidden="true">&#8250;</span>
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <>
          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => scrollTo(index)}
                className={`overflow-hidden rounded border transition ${
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

          <div className="mt-4 flex items-center justify-center gap-2 md:hidden">
            {images.map((image, index) => (
              <button
                key={`dot-${image}-${index}`}
                type="button"
                onClick={() => scrollTo(index)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  selectedIndex === index ? "bg-white" : "bg-white/30"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}

      <Lightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        index={selectedIndex}
        slides={slides}
        on={{
          view: ({ index }) => {
            setSelectedIndex(index)
            emblaApi?.scrollTo(index)
          },
        }}
      />
    </div>
  )
}
