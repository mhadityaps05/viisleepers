import React from "react"

export default function page() {
  return (
    <div>
      <div className="pt-10">
        <div className="grid lg:flex justify-start lg:pl-100 overflow-hidden">
          <div className="grid grid-cols-3 gap-5">
            <div className="flex flex-col gap-5">
              <a className="cursor-pointer">Contact Us</a>
              <a className="cursor-pointer">Instagram</a>
              <a className="cursor-pointer">FAQs</a>
            </div>

            <div className="flex flex-col gap-5">
              <a className="cursor-pointer">Shipping & returns</a>
              <a className="cursor-pointer">Start a return</a>
            </div>

            <div className="flex flex-col gap-5">
              <a className="cursor-pointer">Terms & policies</a>
            </div>
          </div>
          <div className="lg:ml-30 w-60 pt-10">
            <span className="text-white/50">JOIN US</span>
            <input
              type="email"
              placeholder="Enter your email address here"
              className="w-full border-b  py-3 focus:outline-none lg:mt-5"
            />
          </div>
        </div>

        <div className="lg:pt-20 pt-10">
          <span className="text-white/20">Copyrigth 2026 viisleepers</span>
          <span className="lg:ml-56 ml-[25%]">Credits</span>
        </div>
      </div>
    </div>
  )
}
