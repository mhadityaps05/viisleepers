import React from "react"

export default function page() {
  return (
    <div>
      <div className="pt-10">
        <div className="grid lg:flex justify-start lg:pl-100 overflow-hidden">
          <div className="grid grid-cols-3 gap-5">
            <div className="flex flex-col gap-5">
              <a className="cursor-pointer" href="../pages/contact">
                Contact Us
              </a>
              <a
                className="cursor-pointer"
                href="https://www.instagram.com/viisleepers/"
              >
                Instagram
              </a>
              <a className="cursor-pointer" href="../pages/faq">
                FAQs
              </a>
            </div>

            <div className="flex flex-col gap-5">
              <a className="cursor-pointer" href="../pages/shipping">
                Shipping & returns
              </a>
              <a className="cursor-pointer" href="../pages/startreturn">
                Start a return
              </a>
            </div>

            <div className="flex flex-col gap-5">
              <a className="cursor-pointer" href="../pages/terms&policies">
                Terms & policies
              </a>
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
