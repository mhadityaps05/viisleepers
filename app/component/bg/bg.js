"use client"
import React, { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export default function Bg() {
  const bgRef = useRef(null)

  useEffect(() => {
    const bg = bgRef.current
    if (!bg) return

    // Parallax scroll effect on background
    gsap.to(bg, {
      yPercent: 100,
      scrollTrigger: {
        trigger: bg,
        start: "enter",
        end: "bottom center",
        scrub: 1,
        markers: false,
      },
    })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  return (
    <div
      ref={bgRef}
      className="bg absolute inset-0 overflow-hidden flex justify-center items-center z-[-1] w-full"
    >
      <img
        src="bg.svg"
        alt="Background"
        className="w-full h-full object-cover"
      />
    </div>
  )
}
