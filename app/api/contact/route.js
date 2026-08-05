import { NextResponse } from "next/server"
import { Resend } from "resend"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = "viisleepers <orders@viisleepers.com>"
const destinationEmail = "viisleepers@gmail.com"

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase()
}

function renderContactEmailHtml({ name, email, message }) {
  return `
  <!doctype html>
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>New Contact Form</title>
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
            <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#111111;">New Contact Form Submission</h1>

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0;border:1px solid #ebebeb;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:16px 18px;background:#fafafa;border-bottom:1px solid #ebebeb;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#666666;">Customer Message</td>
              </tr>
              <tr>
                <td style="padding:16px 18px;">
                  <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Name:</strong> ${escapeHtml(name)}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Email:</strong> ${escapeHtml(email)}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#222222;"><strong>Message:</strong></p>
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#222222;white-space:pre-wrap;">${escapeHtml(message)}</p>
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

export async function POST(request) {
  try {
    const body = await request.json()
    const name = normalizeString(body?.name)
    const email = normalizeEmail(body?.email)
    const message = normalizeString(body?.message)

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required." },
        { status: 400 },
      )
    }

    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { success: false, message: "A valid email is required." },
        { status: 400 },
      )
    }

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Message is required." },
        { status: 400 },
      )
    }

    if (!resendApiKey) {
      return NextResponse.json(
        { success: false, message: "Email service is not configured." },
        { status: 500 },
      )
    }

    const resend = new Resend(resendApiKey)

    await resend.emails.send({
      from: fromEmail,
      to: [destinationEmail],
      replyTo: email,
      subject: `New Contact Form - ${name}`,
      html: renderContactEmailHtml({
        name,
        email,
        message,
      }),
    })

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been sent successfully.",
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send your message. Please try again.",
      },
      { status: 500 },
    )
  }
}
