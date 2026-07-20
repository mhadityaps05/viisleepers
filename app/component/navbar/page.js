"use client"
import React, { useState } from "react"

export default function page() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="font-benguiat font-bold fixed top-0 left-0 right-0 z-20 flex items-center justify-between h-16 md:h-[20%] px-6 py-10 md:px-[15%]">
      <img
        src="logo.svg"
        alt="Logo"
        className="w-12 md:w-[5%] object-contain"
      />

      <div className="flex gap-10 text-xl lg:text-2xl">
        <a href="#" className="text-white">
          Shop
        </a>
        <a href="#" className="text-white">
          Bag (0)
        </a>
      </div>
    </nav>
  )
}
