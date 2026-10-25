import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  for (const u of users) {
    const emailNorm = (u.email || '').trim().toLowerCase()
    if (emailNorm !== u.email) {
      try {
        await prisma.user.update({ where: { id: u.id }, data: { email: emailNorm } })
        console.log('Normalizado:', u.email, '->', emailNorm)
      } catch (e) {
        console.log('Conflito ao normalizar', u.email, e.message)
      }
    }
  }
  console.log('Concluído')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
