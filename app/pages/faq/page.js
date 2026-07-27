import React from "react"
import Navbar from "@/app/component/navbar/page"
import Foots from "@/app/component/foots/page"

export default function page() {
  return (
    <div className="w-full font-benguiat min-h-screen p-5">
      <Navbar />
      <div className="">
        <img src="/asset/faq.png" />
      </div>

      <div className="absolute top-30 lg:top-130 left-10 text-xl lg:text-5xl">
        <p>FAQ</p>
      </div>
      <div className="grid justify-center w-full items-center pt-10 lg:pt-20 pb-20">
        <div className="w-90 lg:w-190 mt-10">
          <h1 className="text-2xl font-bold">
            How long does it take to process my order?
          </h1>
          <h2 className="space-y-5 mt-5 text-xl">
            <p>
              Orders are processed within 1–3 business days, Monday through
              Friday. Once your order has been shipped, you will receive a
              confirmation email with your tracking information.
            </p>
            <p>
              Orders placed on weekends or public holidays will be processed on
              the next business day.
            </p>
          </h2>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">
              How will my order be shipped?
            </h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <p>
                All orders are shipped through our trusted shipping partners.
                Delivery times may vary depending on your location, courier
                service, and unforeseen circumstances.
              </p>
              <p>
                Once your order has been dispatched, you will receive a tracking
                number via email.
              </p>
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">What is your return policy?</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              Returns or exchanges may be requested within 7 days of receiving
              your order. Returned items must be unused, unworn, unwashed, and
              in their original packaging with all tags attached. Sale,
              promotional, and Final Sale items are not eligible for returns or
              exchanges unless they arrive damaged or incorrect. For more
              information, please visit our Shipping & Returns page.
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">
              When will I receive my refund?
            </h1>
            <h2 className="space-y-5 mt-5 text-xl">
              Once we receive and inspect your returned item, approved refunds
              will be processed within 5–10 business days using your original
              payment method, where applicable. Processing times may vary
              depending on your payment provider.
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">Refunds</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              Approved refunds will be processed using the original payment
              method whenever applicable. Please allow 5–10 business days for
              the refund to appear, depending on your payment provider.
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">How do I request a return?</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              To request a return, please contact our support team at start
              return and include your order number along with the reason for
              your return. Once your request has been approved, we will provide
              return instructions. After shipping your item, please share the
              tracking number with our support team.
            </h2>
          </div>
        </div>
      </div>
      <Foots />
    </div>
  )
}
