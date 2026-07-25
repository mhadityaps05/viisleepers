"use client"
import { useState, useEffect } from "react"
import Lenis from "lenis"
import Navbar from "./component/navbar/page"
import Home from "./home/page"
import About from "./about/page"
import Footer from "./footer/page"
import Loading from "./component/loading/Loading"

type HomeClientProps = {
  children: React.ReactNode
}

const LOADING_SEEN_KEY = "hasSeenLoadingScreen"

export default function HomeClient({ children }: HomeClientProps) {
  // Selalu mulai dengan true, SAMA PERSIS antara server & client,
  // biar nggak ada hydration mismatch.
  const [showLoading, setShowLoading] = useState(true)
  const [checkedSession, setCheckedSession] = useState(false)

  useEffect(() => {
    // Ini jalan HANYA di client, SETELAH hydration selesai.
    // Aman baca sessionStorage di sini.
    const alreadySeen = sessionStorage.getItem(LOADING_SEEN_KEY)
    if (alreadySeen) {
      setShowLoading(false)
    }
    setCheckedSession(true)
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
    sessionStorage.setItem(LOADING_SEEN_KEY, "true")
    setShowLoading(false)
  }

  // Tunggu sampai kita udah sempat cek sessionStorage,
  // biar nggak sempat "kelihatan" Loading walau cuma sekejap buat returning visitor.
  if (!checkedSession) {
    return <div className="fixed inset-0 z-50 bg-black" />
  }

  return (
    <div>
      {showLoading && <Loading onComplete={handleLoadingComplete} />}
      {!showLoading && (
        <>
          <Navbar />
          <Home />
          <About />
          {children}
          <Footer />
        </>
      )}
    </div>
  )
}
