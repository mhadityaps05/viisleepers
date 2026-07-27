import React from "react"
import Navbar from "@/app/component/navbar/page"
import Foots from "@/app/component/foots/page"
export default function page() {
  return (
    <div className="w-full font-benguiat min-h-screen p-5">
      <Navbar />
      <div className="">
        <img src="/asset/contact.png" />
      </div>

      <div className="absolute top-30 lg:top-130 left-10 text-xl lg:text-5xl">
        <p>Contact</p>
      </div>
      <div className="pt-10 text-xl">
        <p className="font-bold">Get in touch</p>
        <div className="grid gap-5 pt-5">
          <input
            placeholder="Your name"
            className="w-full border-b py-3 focus:outline-none lg:mt-5"
          />
          <input
            type="email"
            placeholder="Your email"
            className="w-full border-b py-3 focus:outline-none lg:mt-5"
          />
          <textarea
            placeholder="Your message"
            className="w-full border-b focus:outline-none lg:mt-5"
          />
        </div>

        <button className="text-white w-full border hover:bg-white hover:text-black border-white font-bold py-2 px-4 rounded mt-5">
          Send
        </button>
      </div>
      <Foots />
    </div>
  )
}
