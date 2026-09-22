"use client"
import { useEffect, useRef } from "react"
import Bg from "../component/bg/bg"
import gsap from "gsap"

function Home() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      })

      tl.fromTo(
        ".home-title",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1 },
      )
      tl.fromTo(
        ".home-line",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.8 },
        "<0.2",
      )
      tl.fromTo(".bg-media", { scale: 0.5 }, { scale: 1, duration: 1.4 }, 0)
      tl.fromTo(
        ".bg-overlay",
        { opacity: 0.45 },
        { opacity: 0.2, duration: 1.2, ease: "power2.out" },
        0,
      )
    }, container)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 h-screen w-screen overflow-hidden"
    >
      <Bg />

      <div className="relative z-10 flex h-full w-full items-start md:items-center">
        <div className="max-w-6xl mx-auto px-4 font-benguiat text-center md:text-left">
          <div className="home-title text-5xl md:text-9xl font-bold md:mt-[10%] mt-[80%] flex justify-center">
            SEVEN SLEEPERS
          </div>
          <div className="home-line border-b-2 border-white w-full mt-4"></div>
          <div className="home-copy flex flex-col md:flex-row justify-start gap-8 md:gap-[15%] text-base md:text-2xl mt-10 md:mt-[10%] text-left text-white/60"></div>
        </div>
      </div>

      <div className="bg-overlay pointer-events-none absolute inset-0 z-1 bg-black/20" />
    </div>
  )
}

export default Home
