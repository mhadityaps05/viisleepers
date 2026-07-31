import "server-only"
import midtransClient from "midtrans-client"

function parseIsProduction(value) {
  return String(value).toLowerCase() === "true"
}

// Server key stays on the server and must never be exposed to client bundles.
const serverKey = process.env.MIDTRANS_SERVER_KEY

if (!serverKey) {
  throw new Error("MIDTRANS_SERVER_KEY must be set.")
}

const isProduction = parseIsProduction(process.env.MIDTRANS_IS_PRODUCTION)

// Snap client is used to create payment transactions on the server.
export const snap = new midtransClient.Snap({
  isProduction,
  serverKey,
})

export function getMidtransConfig() {
  return {
    isProduction,
  }
}
