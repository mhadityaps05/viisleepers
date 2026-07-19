"use client"
import React, { useState } from "react"

export default function page() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="font-benguiat font-bold fixed top-0 left-0 right-0 z-20 flex items-center justify-between h-16 md:h-[20%] px-4 md:px-[15%]">
      <img
        src="logo.svg"
        alt="Logo"
        className="w-12 md:w-[5%] object-contain"
      />

      <div className="hidden md:flex gap-10 text-2xl">
        <a href="#" className="text-white">
          Shop
        </a>
        <a href="#" className="text-white">
          Bag
        </a>
      </div>

      <button
        className="md:hidden text-white"
        onClick={() => setOpen((s) => !s)}
        aria-label="Toggle menu"
      >
        <div className="space-y-1">
          <span className="block w-6 h-0.5 bg-white"></span>
          <span className="block w-6 h-0.5 bg-white"></span>
          <span className="block w-6 h-0.5 bg-white"></span>
        </div>
      </button>

      {open && (
        <div className="absolute top-full right-4 mt-2 bg-black bg-opacity-80 text-white p-4 rounded flex flex-col gap-3 z-20">
          <a href="#" onClick={() => setOpen(false)}>
            Shop
          </a>
          <a href="#" onClick={() => setOpen(false)}>
            Bag
          </a>
        </div>
      )}
    </nav>
  )
}
