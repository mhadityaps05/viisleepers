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

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function renderReturnEmailTemplate({
  heading,
  intro,
  orderNumber,
  orderItems,
  status,
  createdAt,
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
            <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#111111;">${escapeHtml(heading)}</h1>
            <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#333333;">${escapeHtml(intro)}</p>

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0;border:1px solid #ebebeb;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:16px 18px;background:#fafafa;border-bottom:1px solid #ebebeb;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#666666;">Return Request Summary</td>
              </tr>
              <tr>
                <td style="padding:16px 18px;">
                  <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Order Number:</strong> ${escapeHtml(orderNumber)}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Order Items:</strong> ${escapeHtml(orderItems)}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Status:</strong> ${escapeHtml(status)}</p>
                  <p style="margin:0;font-size:14px;color:#222222;"><strong>Submitted At:</strong> ${escapeHtml(formatDate(createdAt))}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `
}

async function sendReturnEmail({
  to,
  subject,
  heading,
  intro,
  orderNumber,
  orderItems,
  status,
  createdAt,
}) {
  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject,
    html: renderReturnEmailTemplate({
      heading,
      intro,
      orderNumber,
      orderItems,
      status,
      createdAt,
    }),
  })
}

export async function sendReturnRequestConfirmationEmail({
  email,
  orderNumber,
  orderItems,
  status,
  createdAt,
}) {
  if (!resendApiKey) {
    return { sent: false, reason: "RESEND_API_KEY is not configured." }
  }

  await sendReturnEmail({
    to: email,
    subject: `Return request received - ${orderNumber}`,
    heading: "We received your return request",
    intro:
      "Thank you. Our support team will review your request and contact you with the next steps shortly.",
    orderNumber,
    orderItems,
    status,
    createdAt,
  })

  return { sent: true }
}

export async function sendReturnStatusUpdateEmail({
  email,
  orderNumber,
  orderItems,
  status,
  createdAt,
}) {
  if (!resendApiKey) {
    return { sent: false, reason: "RESEND_API_KEY is not configured." }
  }

  await sendReturnEmail({
    to: email,
    subject: `Return request update - ${orderNumber}`,
    heading: `Return request status: ${status}`,
    intro:
      "Your return request status has been updated. Please review the details below.",
    orderNumber,
    orderItems,
    status,
    createdAt,
  })

  return { sent: true }
}
