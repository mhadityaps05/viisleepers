import React from "react"
import Navbar from "@/app/component/navbar/page"
import Foots from "@/app/component/foots/page"

export default function page() {
  return (
    <div className="w-full min-h-screen p-5 font-benguiat">
      <Navbar />
      <div className="pt-20">
        <h1 className="text-3xl">Lookbook</h1>
      </div>
      <div className="w-full overflow-x-auto scroll-x">
        <div className="flex w-max flex-nowrap justify-start gap-2 px-2 py-2 sm:gap-8 sm:px-4 lg:w-full lg:justify-center lg:gap-12 lg:mt-20 lg:px-0 lg:text-xl">
          <img src="/asset/lookbook1.png" />
          <img src="/asset/lookbook3.png" />
          <img src="/asset/lookbook4.png" />
        </div>
      </div>

      <Foots />
    </div>
  )
}
