import React from "react"
import Navbar from "@/app/component/navbar/page"
import Foots from "@/app/component/foots/page"
export default function page() {
  return (
    <div className="w-full p-5">
      <Navbar />
      <img src="/asset/startreturn.png" alt="Start Return" />
      <div className="absolute top-25 lg:top-130 left-10 text-xl lg:text-5xl">
        Start a Return
      </div>
      <div className="pt-10 text-xl">Return form</div>
      <div className="pt-5 text-xl space-y-5">
        <p>
          To submit your return request, please complete the form below. A
          member of our team will contact you by email to confirm your request
          and provide a return authorization number along with further
          instructions.
        </p>
        <p>
          For pre-orders placed over 21 days ago, please contact us at
          <br />
          <a href="https://www.instagram.com/viisleepers" className="font-bold">
            instagram viisleepers
          </a>
          <br />
          Our team will assist with your return request, provided it falls
          within our 14-day return policy.
        </p>
      </div>
      <div>
        <input
          type="email"
          placeholder="Your email*"
          className="w-full border-b py-3 focus:outline-none lg:mt-5"
        />
        <input
          placeholder="Your order number*"
          className="w-full border-b py-3 focus:outline-none lg:mt-5"
        />
        <input
          placeholder="Your order items*"
          className="w-full border-b py-3 focus:outline-none lg:mt-5"
        />
      </div>
      <button className="text-white w-full border hover:bg-white hover:text-black border-white font-bold py-2 px-4 rounded mt-5">
        Send
      </button>
      <Foots />
    </div>
  )
}
