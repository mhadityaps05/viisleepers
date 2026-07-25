import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined
}

if (!process.env.DIRECT_URL && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL or DIRECT_URL must be set for Prisma")
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })

if (process.env.NODE_ENV !== "production") global.prisma = prisma
