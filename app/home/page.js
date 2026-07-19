"use client"
import React, { useEffect, useRef } from "react"
import Bg from "../component/bg/bg"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

function Home() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Parallax scroll effect on background
    gsap.to(container, {
      yPercent: 100,
      scrollTrigger: {
        trigger: container,
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

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      tl.from(".bg", {
        scale: 2,
        opacity: 0,
        duration: 1.5,
        ease: "power3.out",
      })
      tl.from(".home-title", {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      })
      tl.from(
        ".home-line",
        {
          scaleX: 0,
          transformOrigin: "center",
          duration: 0.8,
          ease: "power3.out",
        },
        "<0.2",
      )
      tl.from(
        ".home-copy > div",
        {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.15,
        },
        "<0.2",
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full min-h-screen flex items-start md:items-center fixed inset-0 overflow-hidden"
    >
      <Bg />

      <div className="w-full max-w-6xl mx-auto px-4 font-benguiat text-center md:text-left">
        <div className="home-title text-5xl md:text-9xl font-bold md:mt-[10%] mt-[50%] flex justify-center">
          SEVEN SLEEPERS
        </div>
        <div className="home-line border-b-2 border-white w-full mt-4 origin-left"></div>
        <div className="home-copy flex flex-col md:flex-row justify-start gap-8 md:gap-[15%] text-base md:text-2xl mt-10 md:mt-[10%] text-left">
          <div>
            a famous ancient legend about a group of persecuted youths who hid
            in a cave and miraculously slept for roughly 300 years
          </div>
          <div>
            Premium essentials crafted with comfort, simplicity, and lasting
            quality.
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
