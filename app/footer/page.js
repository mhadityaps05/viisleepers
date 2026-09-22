import React from "react"
import Link from "next/link"
import Foots from "../component/foots/page"

export default function Footer() {
  return (
    <div className="relative w-full min-h-screen bg-black p-5 font-benguiat">
      <div className="w-full overflow-x-auto scroll-x">
        <div className="flex w-max flex-nowrap justify-start gap-2 px-2 py-2 sm:gap-8 sm:px-4 lg:w-full lg:justify-center lg:gap-12 lg:mt-20 lg:px-0 lg:text-xl">
          <Link href="/pages/shipping">
            <div className="min-w-35 shrink-0 cursor-pointer sm:min-w-45 lg:min-w-55">
              <label>Shipping & Returns</label>
              <img
                src="asset/shipping.png"
                className="mt-5 w-50 sm:w-32 lg:w-56"
              />
            </div>
          </Link>
          <Link href="/pages/contact">
            <div className="min-w-35 shrink-0 cursor-pointer  sm:min-w-45 lg:min-w-55">
              <label>Contact us</label>
              <img
                src="asset/email.png"
                className="mt-5 w-50 sm:w-32 lg:w-56"
              />
            </div>
          </Link>
          <Link href="/pages/lookbook">
            <div className="min-w-35 shrink-0 cursor-pointer sm:min-w-45 lg:min-w-55">
              <label>Lookbook</label>
              <img
                src="asset/lookbook.JPG"
                className="mt-5 w-60 h-85 sm:w-32 lg:w-80 lg:h-95"
              />
            </div>
          </Link>
          <Link href="/pages/press">
            <div className="min-w-35 shrink-0 cursor-pointer sm:min-w-45 lg:min-w-55">
              <label>Press</label>
              <img
                src="asset/press.JPG"
                className="mt-5 w-60 h-85 sm:w-32 lg:h-95 lg:w-80"
              />
            </div>
          </Link>
        </div>
      </div>
      <Foots />
    </div>
  )
}
