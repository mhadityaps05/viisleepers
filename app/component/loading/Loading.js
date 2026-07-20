"use client"

import React, { useEffect, useState, useRef } from "react"
import gsap from "gsap"

export default function Loading({ onComplete = () => {} }) {
  const [progress, setProgress] = useState(0)
  const progressRef = useRef({ value: 0 })

  useEffect(() => {
    const timeline = gsap.timeline({
      onComplete: () => {
        gsap.to("#loading-overlay", {
          opacity: 0,
          duration: 0.7,
          onComplete: onComplete,
        })
      },
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
        ".loading-image",
        {
          scale: 10,
          duration: 0.7,
          ease: "power2.in",
        },
        2.4,
      )
      .to(
        "#loading-overlay",
        { backgroundColor: "#000000", duration: 0.5, ease: "power2.in" },
        2.5,
      )

    return () => {
      timeline.kill()
    }
  }, [onComplete])

  return (
    <div
      id="loading-overlay"
      className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center overflow-hidden"
    >
      <div className="relative w-full h-full flex justify-center items-center overflow-hidden">
        <img
          src="loading/loading.png"
          alt="Loading cave"
          className="loading-image absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative z-10 w-full max-w-xl px-6">
          <div className="mb-4 text-center text-white text-2xl font-bold tracking-widest font-benguiat flex justify-center">
            <img src={"logo.svg"} />
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
