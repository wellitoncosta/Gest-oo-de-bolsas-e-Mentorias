import 'dotenv/config'
import { mkdir, access } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const serverRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const schemaPath = resolve(serverRoot, 'prisma/schema.prisma')
const databaseUrl = process.env.DATABASE_URL || ''

if (!databaseUrl.startsWith('file:') || databaseUrl === 'file::memory:') {
  throw new Error('db:sync só suporta bases SQLite em ficheiro para criar um backup seguro.')
}

const rawPath = decodeURIComponent(databaseUrl.slice(5).split('?')[0])
const databasePath = isAbsolute(rawPath) ? rawPath : resolve(serverRoot, 'prisma', rawPath)
await access(databasePath)
const backupsDir = resolve(serverRoot, 'backups')
await mkdir(backupsDir, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupPath = resolve(backupsDir, `database-${stamp}.db`)
execFileSync(process.execPath, ['prisma/db-backup.js'], {
  cwd: serverRoot,
  env: { ...process.env, BM_DATABASE_BACKUP_PATH: backupPath },
  stdio: 'inherit',
})

execFileSync(
  process.execPath,
  ['node_modules/prisma/build/index.js', 'db', 'push', '--schema', schemaPath],
  {
    cwd: serverRoot,
    stdio: 'inherit',
  },
)
execFileSync(process.execPath, ['prisma/corrigir-areas-demo.js'], {
  cwd: serverRoot,
  stdio: 'inherit',
})
console.log(`Sincronização concluída. Backup: ${backupPath}`)
