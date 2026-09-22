"use client"
import React, { useRef } from "react"
import Link from "next/link"

function page() {
  return (
    <div className="w-full min-h-screen font-benguiat overflow-hidden">
      <div className="p-5">
        <div>
          <h1 className="lg:text-5xl text-3xl lg:pt-10">BOOK YOUR TICKET</h1>
        </div>
        <div className="w-full relative lg:overflow-x-auto">
          <Link href="/booking" className="lg:flex grid mt-5 lg:w-90 gap-10">
            <img src="/poster.png" alt="Event Poster" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default page
