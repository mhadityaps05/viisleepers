import "server-only"
import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = "viisleepers <orders@viisleepers.com>"

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function formatRupiah(value) {
  const normalized = Number(value) || 0
  return `Rp${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(normalized)}`
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value))
}

function toProductNames(productNames) {
  if (!Array.isArray(productNames)) {
    return []
  }

  return productNames
    .map((name) => String(name || "").trim())
    .filter((name) => Boolean(name))
}

function getFirstProductName(productNames) {
  const names = toProductNames(productNames)
  if (names.length === 0) {
    return "Your order"
  }

  return names[0]
}

function renderProductList(productNames) {
  const names = toProductNames(productNames)
  if (names.length === 0) {
    return "<li>Product</li>"
  }

  return names.map((name) => `<li>${escapeHtml(name)}</li>`).join("")
}

function renderEmailTemplate({
  heading,
  intro,
  customerName,
  orderNumber,
  productNames,
  total,
  paymentStatus,
  orderStatus,
  createdAt,
  extraContent,
}) {
  return `
  <!doctype html>
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(heading)}</title>
    </head>
    <body style="margin:0;padding:24px;background:#f5f5f5;color:#111111;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:28px 28px 20px;border-bottom:1px solid #eeeeee;background:#ffffff;">
            <div style="font-size:22px;font-weight:700;letter-spacing:0.08em;">viisleepers</div>
          </td>
        </tr>

        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#2b2b2b;">Hi ${escapeHtml(customerName)},</p>
            <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#111111;">${escapeHtml(heading)}</h1>
            <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#333333;">${escapeHtml(intro)}</p>

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 22px;border:1px solid #ebebeb;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:16px 18px;background:#fafafa;border-bottom:1px solid #ebebeb;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#666666;">Order Summary</td>
              </tr>
              <tr>
                <td style="padding:16px 18px;">
                  <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Order Number:</strong> ${escapeHtml(orderNumber)}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Order Date:</strong> ${escapeHtml(formatDate(createdAt))}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Total Price:</strong> ${escapeHtml(formatRupiah(total))}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Payment Status:</strong> ${escapeHtml(paymentStatus)}</p>
                  <p style="margin:0 0 10px;font-size:14px;color:#222222;"><strong>Order Status:</strong> ${escapeHtml(orderStatus)}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Product Name(s):</strong></p>
                  <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:#222222;">
                    ${renderProductList(productNames)}
                  </ul>
                </td>
              </tr>
            </table>

            ${extraContent || ""}
          </td>
        </tr>

        <tr>
          <td style="padding:22px 28px;border-top:1px solid #eeeeee;background:#fbfbfb;">
            <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#444444;">Thank you for shopping with viisleepers.</p>
            <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#444444;">If you have any questions, DM us on Instagram viisleepers.</p>
            <p style="margin:0;font-size:12px;color:#666666;">&copy; viisleepers</p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `
}

async function sendStatusEmail({
  customerEmail,
  subject,
  heading,
  intro,
  customerName,
  orderNumber,
  productNames,
  total,
  paymentStatus,
  orderStatus,
  createdAt,
  extraContent,
}) {
  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from: fromEmail,
    to: [customerEmail],
    subject,
    html: renderEmailTemplate({
      heading,
      intro,
      customerName,
      orderNumber,
      productNames,
      total,
      paymentStatus,
      orderStatus,
      createdAt,
      extraContent,
    }),
  })
}

export async function sendProcessingEmail(payload) {
  const firstProductName = getFirstProductName(payload.productNames)

  await sendStatusEmail({
    ...payload,
    subject: `Your order is being prepared – ${firstProductName}`,
    heading: "Your order is being prepared",
    intro:
      "Thank you for your purchase! We've received your payment and your order is now being carefully prepared by our team. We'll send you another update once it has been shipped.",
  })
}

export async function sendShippingEmail(payload) {
  const firstProductName = getFirstProductName(payload.productNames)
  const shippingDetails = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0;border:1px solid #ebebeb;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:16px 18px;background:#fafafa;border-bottom:1px solid #ebebeb;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#666666;">Shipping Information</td>
      </tr>
      <tr>
        <td style="padding:16px 18px;">
          <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Courier:</strong> ${escapeHtml(payload.courier || "-")}</p>
          <p style="margin:0 0 10px;font-size:14px;color:#222222;"><strong>Tracking Number:</strong> ${escapeHtml(payload.trackingNumber || "-")}</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#333333;">You can track your shipment using the tracking number above.</p>
        </td>
      </tr>
    </table>
  `

  await sendStatusEmail({
    ...payload,
    subject: `Your order has been shipped – ${firstProductName}`,
    heading: "Your order has been shipped",
    intro: "Your order is on the way.",
    extraContent: shippingDetails,
  })
}

export async function sendDeliveredEmail(payload) {
  const firstProductName = getFirstProductName(payload.productNames)

  await sendStatusEmail({
    ...payload,
    subject: `Your order has been delivered – ${firstProductName}`,
    heading: "Your order has been delivered",
    intro: "Your order has been delivered.",
  })
}

export async function sendCancelledEmail(payload) {
  const firstProductName = getFirstProductName(payload.productNames)

  await sendStatusEmail({
    ...payload,
    subject: `Your order has been cancelled – ${firstProductName}`,
    heading: "Your order has been cancelled",
    intro: "Your order has been cancelled.",
  })
}

export async function sendOrderStatusEmail({
  customerEmail,
  customerName,
  orderNumber,
  orderStatus,
  paymentStatus,
  total,
  createdAt,
  productNames,
  courier,
  trackingNumber,
}) {
  if (!resendApiKey) {
    return { sent: false, reason: "RESEND_API_KEY is not configured." }
  }

  const payload = {
    customerEmail,
    customerName,
    orderNumber,
    productNames,
    total,
    paymentStatus,
    orderStatus,
    createdAt,
    courier,
    trackingNumber,
  }

  if (orderStatus === "Processing") {
    await sendProcessingEmail(payload)
    return { sent: true }
  }

  if (orderStatus === "Shipping") {
    await sendShippingEmail(payload)
    return { sent: true }
  }

  if (orderStatus === "Delivered") {
    await sendDeliveredEmail(payload)
    return { sent: true }
  }

  if (orderStatus === "Cancelled") {
    await sendCancelledEmail(payload)
    return { sent: true }
  }

  return { sent: false, reason: "No email template for this status." }
}
