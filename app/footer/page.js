import React from "react"
import Foots from "../component/foots/page"

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
      <Foots />
    </div>
  )
}
