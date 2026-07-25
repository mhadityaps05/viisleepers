import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const username = "admin"
  const plainPassword = "viisleepers" // ganti ini

  const hashedPassword = await bcrypt.hash(plainPassword, 10)

  // If Prisma client types don't include `admin`, bypass typing for this call
  const admin = await (prisma as any).admin.upsert({
    where: { username },
    update: { password: hashedPassword },
    create: {
      username,
      password: hashedPassword,
    },
  })

  console.log("Admin dibuat/diupdate:", admin.username)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
