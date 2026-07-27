"use client"

import React, { useEffect, useState, useRef } from "react"
import gsap from "gsap"

export default function Loading({ onComplete = () => {} }) {
  const [progress, setProgress] = useState(0)
  const progressRef = useRef({ value: 0 })
  const overlayRef = useRef(null)
  const loadingImageRef = useRef(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const overlay = overlayRef.current
    const loadingImage = loadingImageRef.current
    if (!overlay || !loadingImage) return

    const timeline = gsap.timeline({
      onComplete: () => {
        setProgress(100)
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.7,
          onComplete: () => onCompleteRef.current(),
        })
      },
    })

    gsap.set(loadingImage, {
      scale: 1,
      transformOrigin: "50% 50%",
      willChange: "transform",
    })

    timeline
      .to(
        progressRef.current,
        {
          value: 100,
          duration: 2.5,
          ease: "none",
          onUpdate: () => setProgress(Math.round(progressRef.current.value)),
        },
        0,
      )
      .to(
        loadingImage,
        {
          scale: 5,
          duration: 0.8,
          ease: "power3.inOut",
        },
        2.1,
      )
      .to(
        overlay,
        { backgroundColor: "#000000", duration: 0.5, ease: "power2.in" },
        2.5,
      )

    return () => {
      timeline.kill()
    }
  }, [onComplete])

  return (
    <div
      ref={overlayRef}
      id="loading-overlay"
      className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center overflow-hidden"
    >
      <div className="relative w-full h-full flex justify-center items-center overflow-hidden">
        <img
          ref={loadingImageRef}
          src="/asset/loading.png"
          alt="Loading cave"
          className="loading-image absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative z-10 w-full max-w-xl px-6">
          <div className="mb-4 text-center text-white text-2xl font-bold tracking-widest font-benguiat flex justify-center">
            <img src={"/logo.svg"} alt="Seven Sleepers logo" />
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 text-center text-sm text-white/30">
            {progress}%
          </div>
        </div>
      </div>
    </div>
  )
}
