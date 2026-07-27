import React from "react"
import Navbar from "@/app/component/navbar/page"
import Foots from "@/app/component/foots/page"

export default function page() {
  return (
    <div className="w-full font-benguiat overflow-hidden p-5">
      <Navbar />
      <div className="grid justify-center w-full items-center pt-25 lg:pt-40 pb-20">
        <h1 className="text-3xl font-bol flex justify-center">
          Terms & Policies
        </h1>
        <div className="w-90 lg:w-190 mt-10">
          <h2 className="space-y-5 mt-5 text-xl">
            <p>
              By accessing or using viisleepers.com, you agree to be bound by
              these Terms & Policies and all applicable laws and regulations.
              These terms may be updated at any time without prior notice.
              Continued use of the website constitutes your acceptance of any
              changes.
            </p>
            <p>
              While we strive to ensure all information on this website is
              accurate, errors may occasionally occur. Product descriptions,
              pricing, availability, and other content are subject to change
              without notice. Viisleepers reserves the right to correct any
              errors, inaccuracies, or omissions and to cancel or refuse orders
              placed based on incorrect information.
            </p>
          </h2>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">Orders</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <p>
                All orders are subject to acceptance and product availability.
                We reserve the right to refuse or cancel any order at our sole
                discretion, including cases involving suspected fraud,
                unauthorized transactions, pricing errors, or inaccurate product
                information.
              </p>
              <p>
                Payment must be completed before an order is processed and
                shipped.
              </p>
              <p>
                Please review all order details carefully before completing your
                purchase. Viisleepers is not responsible for incorrect shipping
                information or product selections submitted during checkout.
              </p>
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">Pricing</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <p>
                All prices displayed on the website are subject to change
                without prior notice.
              </p>
              <p>
                Applicable taxes and shipping fees, where required, will be
                calculated during checkout.
              </p>
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">Shipping</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <p>
                Orders are processed within a reasonable timeframe after payment
                confirmation. Estimated delivery times are provided as a
                guideline and may vary depending on courier services or
                unforeseen circumstances.
              </p>
              <p>
                Viisleepers is not responsible for shipping delays caused by
                courier services, weather conditions, customs procedures, or
                events beyond our control.
              </p>
              <p>
                Responsibility for the shipment transfers to the customer once
                the package has been handed over to the shipping carrier.
              </p>
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">Returns & Exchanges</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <p>
                Returns or exchanges are accepted only if they meet the
                requirements outlined in our Shipping & Returns policy.
              </p>
              <p>
                Returned items must be unworn, unused, in their original
                condition, and include all original packaging and tags.
              </p>
              <p>
                Viisleepers reserves the right to reject any return request that
                does not meet these conditions.
              </p>
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">Final Sale</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <p>
                Products marked as Final Sale, discounted items, promotional
                items, or limited releases are not eligible for returns or
                exchanges unless the item arrives damaged or incorrect.
              </p>
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">Product Availability</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <p>
                All products are offered subject to availability.
                <br /> Viisleepers reserves the right to discontinue, modify, or
                limit the availability of any product without prior notice.
              </p>
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">Intellectual Property</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <p>
                All content on this website—including but not limited to text,
                images, graphics, logos, designs, product photography, videos,
                and other materials—is the intellectual property of Viisleepers
                and is protected under applicable copyright, trademark, and
                intellectual property laws.
                <br /> No content may be copied, reproduced, distributed,
                modified, or used for commercial purposes without prior written
                permission from Viisleepers.
              </p>
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">
              Fraud & Unauthorized Transactions
            </h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <p>
                Viisleepers reserves the right to refuse, suspend, or cancel any
                order suspected of fraudulent activity or unauthorized payment.
                Accounts associated with fraudulent behavior or abuse of our
                services may be restricted from making future purchases.
              </p>
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">Limitation of Liability</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <p>
                To the fullest extent permitted by applicable law, Viisleepers
                shall not be liable for any indirect, incidental, special, or
                consequential damages arising from the use of this website or
                the purchase and use of our products. Our maximum liability
                shall not exceed the amount paid for the product giving rise to
                the claim.
              </p>
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">Disclaimer</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <p>
                All products and services provided by Viisleepers are offered
                "as is" and "as available" without any express or implied
                warranties, including but not limited to warranties of
                merchantability, fitness for a particular purpose, or
                non-infringement.
              </p>
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">Governing Law</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <p>
                These Terms & Policies shall be governed by and interpreted in
                accordance with the applicable laws of the Republic of
                Indonesia. Any disputes arising from the use of this website or
                purchases made through Viisleepers shall be resolved in
                accordance with those laws.
              </p>
            </h2>
          </div>
          <div className="mt-10">
            <h1 className="text-2xl font-bold">Contact</h1>
            <h2 className="space-y-5 mt-5 text-xl">
              <p>
                For any questions regarding these Terms & Policies, please
                contact us at:
              </p>
            </h2>
          </div>
        </div>
      </div>

      <Foots />
    </div>
  )
}
