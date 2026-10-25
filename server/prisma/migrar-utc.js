import { PrismaClient } from '@prisma/client'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const databaseFile = resolve(process.argv[2] || resolve(scriptDir, 'dev.db'))
const databaseUrl = `file:${encodeURI(databaseFile.replaceAll('\\', '/'))}`
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } })

function datePart(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function toUtc(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null
  // Africa/Luanda uses UTC+01:00; preserve that wall-clock meaning as an instant.
  const instant = new Date(`${date}T${time}:00.000+01:00`)
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString()
}

try {
  const columns = await prisma.$queryRawUnsafe('PRAGMA table_info("DisponibilidadeMentor")')
  const columnNames = new Set(columns.map((column) => column.name))
  if (!columnNames.has('inicio')) {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "DisponibilidadeMentor" ADD COLUMN "inicio" DATETIME',
    )
  }
  if (!columnNames.has('fim')) {
    await prisma.$executeRawUnsafe('ALTER TABLE "DisponibilidadeMentor" ADD COLUMN "fim" DATETIME')
  }

  const rows = await prisma.$queryRawUnsafe(
    'SELECT "id", "data", "horaInicio", "horaFim", "inicio", "fim" FROM "DisponibilidadeMentor"',
  )
  let migrated = 0
  let alreadyMigrated = 0
  let invalid = 0

  for (const row of rows) {
    if (row.inicio && row.fim) {
      alreadyMigrated += 1
      continue
    }
    const date = datePart(row.data)
    const start = toUtc(date, row.horaInicio)
    const end = toUtc(date, row.horaFim)
    if (!start || !end || new Date(end) <= new Date(start)) {
      invalid += 1
      console.warn(`Ignorado (data/hora inválida): ${row.id}`)
      continue
    }
    await prisma.$executeRawUnsafe(
      'UPDATE "DisponibilidadeMentor" SET "inicio" = ?, "fim" = ? WHERE "id" = ?',
      start,
      end,
      row.id,
    )
    migrated += 1
  }

  console.log(
    `Migração UTC concluída: ${migrated} migrados, ${alreadyMigrated} já migrados, ${invalid} inválidos, ${rows.length} total.`,
  )
  console.log(`Base usada: ${databaseFile}`)
} catch (error) {
  console.error('Falha ao migrar horários para UTC:', error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
