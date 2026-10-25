import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const backupPath = process.env.BM_DATABASE_BACKUP_PATH
if (!backupPath) throw new Error('O destino do backup não foi configurado.')

const prisma = new PrismaClient()
try {
  await prisma.$executeRawUnsafe(`VACUUM INTO '${backupPath.replaceAll("'", "''")}'`)
} finally {
  await prisma.$disconnect()
}
