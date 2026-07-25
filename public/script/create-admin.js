import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10)

  const admin = await prisma.admin.create({
    data: {
      username: "admin",
      password: hashedPassword,
    },
  })

  console.log(admin)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
