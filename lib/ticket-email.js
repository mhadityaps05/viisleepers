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

function toTicketCodes(ticketCodes) {
  if (!Array.isArray(ticketCodes)) {
    return []
  }

  return ticketCodes
    .map((code) => String(code || "").trim())
    .filter((code) => Boolean(code))
}

function renderTicketCodesList(ticketCodes) {
  const codes = toTicketCodes(ticketCodes)

  if (codes.length === 0) {
    return ""
  }

  return codes
    .map(
      (code) => `
        <tr>
          <td style="padding:0 0 10px;">
            <div style="padding:14px 16px;border:1px dashed #cccccc;border-radius:10px;background:#fafafa;font-family:'Courier New',monospace;font-size:18px;font-weight:700;letter-spacing:0.1em;color:#111111;text-align:center;">
              ${escapeHtml(code)}
            </div>
          </td>
        </tr>
      `,
    )
    .join("")
}

function renderTicketEmailTemplate({
  buyerName,
  eventName,
  ticketTypeName,
  orderNumber,
  quantity,
  total,
  ticketCodes,
}) {
  return `
  <!doctype html>
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Your E-Tickets</title>
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
            <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:#2b2b2b;">Hi ${escapeHtml(buyerName)},</p>
            <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#111111;">Your E-Tickets Are Ready</h1>
            <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#333333;">Thank you for booking! Here ${toTicketCodes(ticketCodes).length > 1 ? "are your ticket codes" : "is your ticket code"} for <strong>${escapeHtml(eventName)}</strong>. Please keep this email safe — you'll need to show your ticket code(s) at entry.</p>

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 22px;border:1px solid #ebebeb;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:16px 18px;background:#fafafa;border-bottom:1px solid #ebebeb;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#666666;">Booking Summary</td>
              </tr>
              <tr>
                <td style="padding:16px 18px;">
                  <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Order Number:</strong> ${escapeHtml(orderNumber)}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Ticket Type:</strong> ${escapeHtml(ticketTypeName)}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Quantity:</strong> ${escapeHtml(quantity)}</p>
                  <p style="margin:0;font-size:14px;color:#222222;"><strong>Total Paid:</strong> ${escapeHtml(formatRupiah(total))}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#666666;">Ticket Code${toTicketCodes(ticketCodes).length > 1 ? "s" : ""}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0;">
              ${renderTicketCodesList(ticketCodes)}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:22px 28px;border-top:1px solid #eeeeee;background:#fbfbfb;">
            <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#444444;">See you at the event!</p>
            <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#444444;">If you have any questions, DM us on Instagram viisleepers.</p>
            <p style="margin:0;font-size:12px;color:#666666;">&copy; viisleepers</p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `
}

export async function sendTicketConfirmationEmail({
  buyerName,
  buyerEmail,
  orderNumber,
  eventName,
  ticketTypeName,
  quantity,
  total,
  ticketCodes,
}) {
  if (!resendApiKey) {
    return { sent: false, reason: "RESEND_API_KEY is not configured." }
  }

  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from: fromEmail,
    to: [buyerEmail],
    subject: `Your E-Tickets – ${eventName}`,
    html: renderTicketEmailTemplate({
      buyerName,
      eventName,
      ticketTypeName,
      orderNumber,
      quantity,
      total,
      ticketCodes,
    }),
  })

  return { sent: true }
}
