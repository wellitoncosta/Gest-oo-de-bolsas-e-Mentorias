import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const serverRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const testDir = await mkdtemp(join(tmpdir(), 'bm-horarios-verification-'))
const testDb = join(testDir, 'verification.db')
const testSchema = join(testDir, 'schema.prisma')
const testUrl = `file:${encodeURI(testDb.replaceAll('\\', '/'))}`
let httpServer
let prisma

try {
  process.env.DATABASE_URL = testUrl
  process.env.JWT_SECRET = 'horarios-verification-only-secret'
  process.env.NODE_ENV = 'test'
  process.env.CLIENT_URL = 'http://localhost:5173'
  await writeFile(testDb, new Uint8Array())
  await copyFile(join(serverRoot, 'prisma', 'schema.prisma'), testSchema)
  execFileSync(
    process.execPath,
    [
      join(serverRoot, 'node_modules', 'prisma', 'build', 'index.js'),
      'db',
      'push',
      '--skip-generate',
      '--schema',
      testSchema,
    ],
    { cwd: testDir, env: process.env, stdio: 'inherit' },
  )
  execFileSync(process.execPath, ['prisma/seed.js'], {
    cwd: serverRoot,
    env: process.env,
    stdio: 'inherit',
  })
  const [{ default: app }, { default: db }] = await Promise.all([
    import('../src/app.js'),
    import('../src/config/db.js'),
  ])
  prisma = db
  const titulosDemo = [
    'Bolsa Investigação IA',
    'Bolsa Dados e Cibersegurança',
    'Bolsa Inovação e StartUp',
  ]
  await Promise.all([
    prisma.bolsa.updateMany({
      where: { titulo: { in: titulosDemo } },
      data: { area: 'engenharia' },
    }),
    prisma.user.updateMany({
      where: { email: 'ana.mentor@demo.com' },
      data: { area: 'engenharia' },
    }),
  ])
  for (let attempt = 0; attempt < 2; attempt += 1) {
    execFileSync(process.execPath, ['prisma/corrigir-areas-demo.js'], {
      cwd: serverRoot,
      env: process.env,
      stdio: 'ignore',
    })
  }
  const [bolsasDemo, mentoraDemo] = await Promise.all([
    prisma.bolsa.findMany({
      where: {
        titulo: {
          in: ['Bolsa Investigação IA', 'Bolsa Dados e Cibersegurança', 'Bolsa Inovação e StartUp'],
        },
      },
      select: { titulo: true, area: true },
    }),
    prisma.user.findUnique({ where: { email: 'ana.mentor@demo.com' }, select: { area: true } }),
  ])
  assert.equal(bolsasDemo.length, 3)
  assert.ok(bolsasDemo.every((bolsa) => bolsa.area === 'tecnologia'))
  assert.equal(mentoraDemo.area, 'tecnologia')
  console.log('OK: migração de áreas corrige os registos e é idempotente.')
  httpServer = app.listen(0, '127.0.0.1')
  await new Promise((resolve, reject) => {
    httpServer.once('listening', resolve)
    httpServer.once('error', reject)
  })
  const baseUrl = `http://127.0.0.1:${httpServer.address().port}/api`

  async function request(path, { token, method = 'GET', body } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    return { status: response.status, data: await response.json() }
  }

  async function login(email) {
    const response = await request('/auth/login', {
      method: 'POST',
      body: { email, senha: 'Pass123!' },
    })
    assert.equal(response.status, 200, `login falhou: ${email}`)
    return response.data.token
  }

  async function createSlot(token, offsetHours = 0) {
    const start = new Date(Date.now() + (48 + offsetHours) * 60 * 60 * 1000)
    start.setUTCMinutes(0, 0, 0)
    const created = await request('/mentorias/disponibilidades', {
      method: 'POST',
      token,
      body: {
        inicio: start.toISOString(),
        fim: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
      },
    })
    assert.equal(created.status, 201, `criação do horário: ${JSON.stringify(created.data)}`)
    return created.data
  }

  async function book(token, slot) {
    const response = await request('/mentorias/agendar', {
      method: 'POST',
      token,
      body: { disponibilidadeId: slot.id, tema: 'Verificação de histórico' },
    })
    assert.equal(response.status, 201, `agendamento: ${JSON.stringify(response.data)}`)
    return response.data
  }

  const mentor = await login('ana.mentor@demo.com')
  const secondMentor = await login('carlos.mentor@demo.com')
  const student = await login('joao.estudante@demo.com')
  const secondStudent = await login('maria.estudante@demo.com')
  const firstSlot = await createSlot(mentor)
  const firstSession = await book(student, firstSlot)
  const closed = await request(`/mentorias/${firstSession.id}/estado`, {
    method: 'PUT',
    token: mentor,
    body: { status: 'CANCELADA', reabrirHorario: false },
  })
  assert.equal(closed.status, 200)
  const publicAfterClose = await request(
    `/mentorias/disponibilidades?mentorId=${closed.data.mentorId}`,
  )
  assert.equal(
    publicAfterClose.data.some(({ id }) => id === firstSlot.id),
    false,
  )
  const replacement = await createSlot(mentor)
  assert.equal(
    replacement.inicio,
    firstSlot.inicio,
    'horário fechado não deve impedir novo horário no mesmo intervalo',
  )
  const firstHistory = await prisma.mentoria.findUnique({ where: { id: firstSession.id } })
  assert.equal(firstHistory.status, 'CANCELADA')
  console.log(
    'OK: cancelar com reabrirHorario=false fecha o horário, permite criar outro no mesmo intervalo e mantém histórico.',
  )

  const reopenSlot = await createSlot(mentor, 3)
  const reopenSession = await book(secondStudent, reopenSlot)
  const reopened = await request(`/mentorias/${reopenSession.id}/estado`, {
    method: 'PUT',
    token: mentor,
    body: { status: 'CANCELADA', reabrirHorario: true },
  })
  assert.equal(reopened.status, 200)
  const publicAfterReopen = await request(
    `/mentorias/disponibilidades?mentorId=${reopened.data.mentorId}`,
  )
  assert.equal(
    publicAfterReopen.data.some(({ id }) => id === reopenSlot.id),
    true,
  )
  console.log('OK: cancelar com reabrirHorario=true volta a publicar o horário.')

  const occupiedSlot = await createSlot(mentor, 6)
  const occupiedSession = await book(student, occupiedSlot)
  const confirmedSession = await request(`/mentorias/${occupiedSession.id}/estado`, {
    method: 'PUT',
    token: mentor,
    body: { status: 'CONFIRMADA' },
  })
  assert.equal(confirmedSession.status, 200)
  const closeOccupied = await request(`/mentorias/disponibilidades/${occupiedSlot.id}`, {
    method: 'DELETE',
    token: mentor,
  })
  assert.equal(closeOccupied.status, 400)
  assert.deepEqual(closeOccupied.data, {
    mensagem: 'Cancele a sessão antes de fechar o horário.',
    codigo: 'HORARIO_OCUPADO',
  })
  const stillActive = await prisma.disponibilidadeMentor.findUnique({
    where: { id: occupiedSlot.id },
    select: { ativa: true },
  })
  assert.equal(stillActive.ativa, true)
  console.log('OK: fechar horário com sessão CONFIRMADA responde 400 e não altera o horário.')

  const cancelConfirmed = await request(`/mentorias/${occupiedSession.id}/estado`, {
    method: 'PUT',
    token: mentor,
    body: { status: 'CANCELADA' },
  })
  assert.equal(cancelConfirmed.status, 200)
  const closeAfterCancel = await request(`/mentorias/disponibilidades/${occupiedSlot.id}`, {
    method: 'DELETE',
    token: mentor,
  })
  assert.equal(closeAfterCancel.status, 200)
  assert.equal(closeAfterCancel.data.codigo, 'DISPONIBILIDADE_FECHADA')
  const closedAfterCancel = await prisma.disponibilidadeMentor.findUnique({
    where: { id: occupiedSlot.id },
    select: { ativa: true },
  })
  assert.equal(closedAfterCancel.ativa, false)
  console.log('OK: depois de cancelar a sessão, fechar o horário funciona.')

  const flowSlot = await createSlot(secondMentor, 12)
  const flowSession = await book(secondStudent, flowSlot)
  const accepted = await request(`/mentorias/${flowSession.id}/estado`, {
    method: 'PUT',
    token: secondMentor,
    body: { status: 'CONFIRMADA' },
  })
  assert.equal(accepted.status, 200, `aceitação: ${JSON.stringify(accepted.data)}`)
  const completed = await request(`/mentorias/${flowSession.id}/estado`, {
    method: 'PUT',
    token: secondMentor,
    body: { status: 'CONCLUIDA' },
  })
  assert.equal(completed.status, 200, `conclusão: ${JSON.stringify(completed.data)}`)
  const rated = await request(`/mentorias/${flowSession.id}/avaliacao`, {
    method: 'PUT',
    token: secondStudent,
    body: { avaliacao: 5, comentarioAvaliacao: 'Excelente sessão.' },
  })
  assert.equal(rated.status, 200, `avaliação: ${JSON.stringify(rated.data)}`)
  assert.equal(rated.data.avaliacao, 5)
  console.log('OK: fluxo de agendamento, aceitação, conclusão e avaliação.')

  const mentorHistorySlot = await createSlot(mentor, 6)
  await book(student, mentorHistorySlot)
  const deleteMentor = await request('/conta', {
    method: 'DELETE',
    token: mentor,
    body: { senha: 'Pass123!' },
  })
  assert.equal(
    deleteMentor.status,
    200,
    `apagar mentor com histórico: ${JSON.stringify(deleteMentor.data)}`,
  )
  console.log('OK: DELETE /api/conta remove mentor com histórico de mentorias.')

  const studentHistorySlot = await createSlot(secondMentor, 9)
  await book(student, studentHistorySlot)
  const deleteStudent = await request('/conta', {
    method: 'DELETE',
    token: student,
    body: { senha: 'Pass123!' },
  })
  assert.equal(
    deleteStudent.status,
    200,
    `apagar estudante com histórico: ${JSON.stringify(deleteStudent.data)}`,
  )
  console.log('OK: DELETE /api/conta remove estudante com histórico de mentorias.')
} catch (error) {
  console.error('Falha na verificação de horários:', error)
  process.exitCode = 1
} finally {
  if (httpServer) await new Promise((resolve) => httpServer.close(resolve))
  if (prisma) await prisma.$disconnect()
  if (testDir.startsWith(tmpdir())) await rm(testDir, { recursive: true, force: true })
}
