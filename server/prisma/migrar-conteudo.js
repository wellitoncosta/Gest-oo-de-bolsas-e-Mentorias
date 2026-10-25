import { PrismaClient } from '@prisma/client'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mapearArea } from '../src/constants/areas.js'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const databaseFile = resolve(process.argv[2] || resolve(scriptDir, 'dev.db'))
const databaseUrl = `file:${encodeURI(databaseFile.replaceAll('\\', '/'))}`
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } })

async function ensureColumn(table, column) {
  const columns = await prisma.$queryRawUnsafe(`PRAGMA table_info("${table}")`)
  if (!columns.some((item) => item.name === column)) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${column}" TEXT`)
  }
}

try {
  for (const [table, column] of [
    ['Bolsa', 'tituloEn'],
    ['Bolsa', 'descricaoEn'],
    ['Bolsa', 'requisitosEn'],
    ['Bolsa', 'valorEn'],
    ['User', 'biografiaEn'],
  ])
    await ensureColumn(table, column)

  let updated = 0
  for (const table of ['Bolsa', 'User']) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT "id", "area" FROM "${table}" WHERE "area" IS NOT NULL`,
    )
    for (const row of rows) {
      const key = mapearArea(row.area)
      if (row.area !== key) {
        await prisma.$executeRawUnsafe(
          `UPDATE "${table}" SET "area" = ? WHERE "id" = ?`,
          key,
          row.id,
        )
        updated += 1
      }
    }
  }
  console.log(`Migração de conteúdo concluída: ${updated} áreas normalizadas.`)
  console.log(`Base usada: ${databaseFile}`)
} catch (error) {
  console.error('Falha ao migrar conteúdo:', error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
