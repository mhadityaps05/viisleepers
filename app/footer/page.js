import React from "react"

export default function Footer() {
  return (
    <div className="relative w-full min-h-screen bg-black p-5 font-benguiat">
      <div className="w-full overflow-x-auto scroll-x">
        <div className="flex w-max flex-nowrap justify-start gap-2 px-2 py-2 sm:gap-8 sm:px-4 lg:w-full lg:justify-center lg:gap-12 lg:mt-20 lg:px-0 lg:text-xl">
          <div className="min-w-[140px] shrink-0 cursor-pointer sm:min-w-[180px] lg:min-w-[220px]">
            <a>Shipping & Returns</a>
            <img
              src="asset/shipping.png"
              className="mt-5 w-50 sm:w-32 lg:w-56"
            />
          </div>

          <div className="min-w-[140px] shrink-0 cursor-pointer  sm:min-w-[180px] lg:min-w-[220px]">
            <a>Contact us</a>
            <img src="asset/email.png" className="mt-5 w-50 sm:w-32 lg:w-56" />
          </div>

          <div className="min-w-[140px] shrink-0 cursor-pointer sm:min-w-[180px] lg:min-w-[220px]">
            <a>Lookbook</a>
            <img
              src="asset/lookbook.png"
              className="mt-5 w-50 sm:w-32 lg:w-56"
            />
          </div>

          <div className="min-w-[140px] shrink-0 cursor-pointer sm:min-w-[180px] lg:min-w-[220px]">
            <a>Press</a>
            <img src="asset/press.png" className="mt-5 w-50 sm:w-32 lg:w-56" />
          </div>
        </div>
      </div>
      <div className="grid lg:flex justify-start lg:pl-100 mt-10 lg:mt-25 overflow-hidden">
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
        <div className="lg:ml-30 w-60 pt-5">
          <span className="text-white/50">JOIN US</span>
          <input
            type="email"
            placeholder="Enter your email address here"
            className="w-full border-b  py-3 focus:outline-none lg:mt-5"
          />
        </div>
      </div>

      <div className="lg:pt-20 pt-5">
        <span className="text-white/20">Copyrigth 2026 viisleepers</span>
        <span className="lg:ml-60 ml-[25%]">Credits</span>
      </div>
    </div>
  )
}
