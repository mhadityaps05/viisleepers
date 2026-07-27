"use client"
import React, { useEffect, useRef } from "react"
import gsap from "gsap"

export default function Bg() {
  const bgRef = useRef(null)

  useEffect(() => {
    const scope = bgRef.current
    if (!scope) return

    const ctx = gsap.context(() => {
      gsap.set(".bg-media", {
        transformOrigin: "50% 50%",
      })
    }, scope)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={bgRef}
      className="bg-stage absolute inset-0 z-0 overflow-hidden flex items-center justify-center"
    >
      <img
        src="/bg.svg"
        alt="Background"
        className="bg-media h-full w-full object-cover object-center"
      />
    </div>
  )
}
