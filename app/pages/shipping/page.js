import React from "react"
import Navbar from "../../component/navbar/page"
import Foots from "../../component/foots/page"
export default function page() {
  return (
    <div className="w-full font-benguiat overflow-hidden p-5">
      <Navbar />
      <div className="grid justify-center w-full items-center pt-25 lg:pt-40 pb-20">
        <h1 className="text-3xl font-bol flex justify-center">
          Shipping & Returns
        </h1>
        <div className="w-90 lg:w-190 mt-10">
          <h1 className="text-2xl font-bold">SHIPPING</h1>
          <h2 className="space-y-5 mt-5 text-xl">
            <p>
              Orders are processed within 1–3 business days after payment
              confirmation.
            </p>
            <p>
              Once your order has been dispatched, you will receive a
              confirmation email with your tracking information. Delivery times
              may vary depending on your location and the courier service.
              Please note that delays caused by weather, holidays, or other
              unforeseen circumstances are beyond our control.
            </p>
            <p>
              Orders are processed Monday through Friday. Orders placed on
              weekends or public holidays will be processed on the next business
              day. For any shipping inquiries <br />
              please contact us at
            </p>
          </h2>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">RETURN & EXCHANGE POLICY</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <p>
                We want you to be completely satisfied with your purchase. If
                you're not happy with your order, you may request a return or
                exchange under the conditions below.
              </p>
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">Return Eligibility</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <ul className="list-disc list-inside">
                <li>
                  Return requests must be made within 7 days of receiving your
                  order.
                </li>
                <li>
                  Items must be unused, unworn, unwashed, and returned in their
                  original packaging with all tags attached.
                </li>
                <li>Proof of purchase is required.</li>
                <li>
                  Sale or promotional items are final sale and cannot be
                  returned or exchanged unless they arrive damaged or incorrect.
                </li>
              </ul>
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">How to Request a Return</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <ul className="list-disc list-inside">
                <li>
                  Contact our support team at support@viisleepers.com with your
                  order number and reason for the return.
                </li>
                <li>Wait for return approval and instructions.</li>
                <li>Ship the item using your preferred courier.</li>
                <li>
                  Once the item has been received and inspected, we will notify
                  you of the outcome.
                </li>
              </ul>
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
            <h1 className="text-2xl font-bold">Important Notes</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <ul className="list-disc list-inside">
                <li>
                  Customers are responsible for return shipping costs unless the
                  item received is defective, damaged, or incorrect.
                </li>
                <li>Shipping fees are non-refundable.</li>
                <li>Ship the item using your preferred courier.</li>
                <li>
                  Viisleepers reserves the right to refuse returns that do not
                  meet the conditions outlined above.
                </li>
              </ul>
            </h2>
          </div>
        </div>
      </div>

      <Foots />
    </div>
  )
}
