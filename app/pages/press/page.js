import React from "react"
import Navbar from "@/app/component/navbar/page"
import Foots from "@/app/component/foots/page"
export default function page() {
  return (
    <div className="w-full min-h-screen p-5 font-benguiat">
      <Navbar />
      <div className="text-5xl justify-center flex pt-50 pb-50">
        COMING SOON
      </div>

      <Foots />
    </div>
  )
}
