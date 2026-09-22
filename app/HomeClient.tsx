"use client"
import { useState, useEffect, useCallback, useRef } from "react"
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
  const lenisRef = useRef<Lenis | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Ini jalan HANYA di client, SETELAH hydration selesai.
    // Aman baca sessionStorage di sini.
    const alreadySeen = sessionStorage.getItem(LOADING_SEEN_KEY)

    const frame = requestAnimationFrame(() => {
      if (alreadySeen) {
        setShowLoading(false)
      }
      setCheckedSession(true)
    })

    return () => cancelAnimationFrame(frame)
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
    lenisRef.current = lenis
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => {
      lenisRef.current = null
      lenis.destroy()
    }
  }, [])

  // Konten asli (Home/About/children/Footer) baru mount setelah showLoading
  // jadi false, dan tinggi totalnya masih bisa berubah belakangan (gambar
  // yang baru selesai fetch+decode, dsb). Daripada menebak titik waktu yang
  // "aman" untuk resize, observe langsung elemen pembungkus konten: setiap
  // kali tinggi kontennya berubah — karena mount awal, gambar yang baru
  // selesai load, atau sebab lain — paksa Lenis hitung ulang document
  // height. requestAnimationFrame di sini cuma buat coalesce beberapa
  // notifikasi ResizeObserver yang datang beruntun (mis. banyak gambar
  // selesai load hampir bersamaan) jadi satu resize() per frame.
  useEffect(() => {
    if (showLoading) {
      return
    }

    const target = contentRef.current

    if (!target || typeof ResizeObserver === "undefined") {
      return
    }

    let frame: number | null = null

    const observer = new ResizeObserver(() => {
      if (frame !== null) {
        return
      }

      frame = requestAnimationFrame(() => {
        frame = null
        lenisRef.current?.resize()
      })
    })

    observer.observe(target)

    return () => {
      observer.disconnect()

      if (frame !== null) {
        cancelAnimationFrame(frame)
      }
    }
  }, [showLoading])

  const handleLoadingComplete = useCallback(() => {
    sessionStorage.setItem(LOADING_SEEN_KEY, "true")
    setShowLoading(false)
  }, [])

  // Tunggu sampai kita udah sempat cek sessionStorage,
  // biar nggak sempat "kelihatan" Loading walau cuma sekejap buat returning visitor.
  if (!checkedSession) {
    return <div className="fixed inset-0 z-50 bg-black" />
  }

  return (
    <div ref={contentRef}>
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
