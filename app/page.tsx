"use client"
import { useState, useEffect } from "react"
import Lenis from "lenis"
import Navbar from "./component/navbar/page"
import Home from "./home/page"
import About from "./about/page"
import Shop from "./shop/page"
import Footer from "./footer/page"
import Loading from "./component/loading/Loading"

export default function page() {
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    // Ensure loading screen shows on first mount
    setShowLoading(true)
  }, [])

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      lerp: 0.1,
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      syncTouch: false,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  const handleLoadingComplete = () => {
    setShowLoading(false)
  }

  return (
    <div>
      {showLoading && <Loading onComplete={handleLoadingComplete} />}
      {!showLoading && (
        <>
          <Navbar />
          <Home />
          <About />
          <Shop />
          <Footer />
        </>
      )}
    </div>
  )
}
