import { SignJWT, jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function createToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret)

    return payload
  } catch {
    return null
  }
}

export async function requireAdmin(request) {
  const token = request.cookies.get("admin-token")?.value

  if (!token) {
    return null
  }

  return await verifyToken(token)
}
