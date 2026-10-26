import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = process.cwd()
const directory = await mkdtemp(join(tmpdir(), 'bm-legacy-slot-'))
const database = join(directory, 'legacy.db')
const schemaFile = join(directory, 'schema.prisma')
let prisma

try {
  const schema = await readFile(join(root, 'prisma', 'schema.prisma'), 'utf8')
  await writeFile(schemaFile, schema.replace(/^\s*ativa\s+Boolean\s+@default\(true\)\r?\n/m, ''))
  await writeFile(database, new Uint8Array())
  process.env.DATABASE_URL = `file:${database.replaceAll('\\', '/')}`
  process.env.JWT_SECRET = 'legacy-slot-verification-secret'
  execFileSync(
    process.execPath,
    [
      join(root, 'node_modules', 'prisma', 'build', 'index.js'),
      'db',
      'push',
      '--skip-generate',
      '--schema',
      schemaFile,
    ],
    { cwd: directory, env: process.env, stdio: 'inherit' },
  )
  const [{ default: db }, { criarDisponibilidade }] = await Promise.all([
    import('../src/config/db.js'),
    import('../src/controllers/mentorias.controller.js'),
  ])
  prisma = db
  const mentor = await prisma.user.create({
    data: { nome: 'Mentor Temporário', email: 'mentor@legacy.test', senha: 'hash', role: 'MENTOR' },
  })
  const inicio = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const req = {
    user: { id: mentor.id },
    body: {
      inicio: inicio.toISOString(),
      fim: new Date(inicio.getTime() + 60 * 60 * 1000).toISOString(),
    },
  }
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code
      return this
    },
    json(data) {
      this.data = data
      return this
    },
  }
  await criarDisponibilidade(req, res, (error) => {
    throw error
  })
  assert.equal(res.statusCode, 201, JSON.stringify(res.data))
  assert.equal(res.data.mentorId, mentor.id)
  assert.equal(await prisma.disponibilidadeMentor.count({ where: { mentorId: mentor.id } }), 1)
  console.log('OK: criar disponibilidade funciona no schema legado sem a coluna ativa.')
} finally {
  if (prisma) await prisma.$disconnect()
  if (directory.startsWith(tmpdir())) await rm(directory, { recursive: true, force: true })
}
