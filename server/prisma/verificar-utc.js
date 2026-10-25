import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { aUTC, formatarDataHora } from '../../client/src/services/datas.js'

const serverRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const testDir = await mkdtemp(join(tmpdir(), 'bm-utc-verification-'))
const testDb = join(testDir, 'dev.db')
const testUrl = `file:${encodeURI(testDb.replaceAll('\\', '/'))}`
let httpServer
let prisma

try {
  await copyFile(join(serverRoot, 'prisma', 'dev.db'), testDb)
  process.env.DATABASE_URL = testUrl
  process.env.JWT_SECRET = 'utc-verification-only-secret'
  process.env.NODE_ENV = 'test'
  process.env.CLIENT_URL = 'http://localhost:5173'

  execFileSync(process.execPath, ['prisma/seed.js'], {
    cwd: serverRoot,
    env: process.env,
    stdio: 'ignore',
  })

  const [{ default: app }, { default: db }] = await Promise.all([
    import('../src/app.js'),
    import('../src/config/db.js'),
  ])
  prisma = db
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
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    return { status: response.status, data: await response.json() }
  }

  async function login(email) {
    const response = await request('/auth/login', {
      method: 'POST',
      body: { email, senha: email.startsWith('admin@') ? 'Admin123!' : 'Pass123!' },
    })
    assert.equal(response.status, 200, `login falhou: ${email}`)
    return response.data.token
  }

  const mentor = await login('ana.mentor@demo.com')
  const studentOne = await login('joao.estudante@demo.com')
  const studentTwo = await login('maria.estudante@demo.com')
  const admin = await login('admin@demo.com')
  const meetingLink = 'https://meet.google.com/abc-defg-hij'
  const mentorProfile = await request('/conta', {
    method: 'PUT', token: mentor,
    body: { fusoHorario: 'Africa/Luanda', linkReuniao: meetingLink },
  })
  assert.equal(mentorProfile.status, 200)
  assert.equal(mentorProfile.data.linkReuniao, meetingLink)
  const future = new Date()
  future.setUTCDate(future.getUTCDate() + 4)
  future.setUTCHours(10, 0, 0, 0)
  const start = future.toISOString()
  const end = new Date(future.getTime() + 60 * 60 * 1000).toISOString()

  const created = await request('/mentorias/disponibilidades', {
    method: 'POST', token: mentor, body: { inicio: start, fim: end },
  })
  assert.equal(created.status, 201, `criação UTC: ${JSON.stringify(created.data)}`)
  assert.equal(new Date(created.data.inicio).toISOString(), start)
  console.log('OK: criação de disponibilidade ISO UTC (201)')

  const overlap = await request('/mentorias/disponibilidades', {
    method: 'POST', token: mentor,
    body: { inicio: new Date(future.getTime() + 15 * 60 * 1000).toISOString(), fim: new Date(future.getTime() + 75 * 60 * 1000).toISOString() },
  })
  assert.equal(overlap.status, 409, `sobreposição devia responder 409: ${JSON.stringify(overlap.data)}`)
  console.log('OK: sobreposição respondida com 409')

  const pastStart = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const past = await request('/mentorias/disponibilidades', {
    method: 'POST', token: mentor,
    body: { inicio: pastStart, fim: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  })
  assert.equal(past.status, 400, `horário passado devia responder 400: ${JSON.stringify(past.data)}`)
  console.log('OK: horário passado respondido com 400')

  const bookingStart = new Date(future.getTime() + 3 * 60 * 60 * 1000)
  const bookingEnd = new Date(bookingStart.getTime() + 60 * 60 * 1000)
  const bookingSlot = await request('/mentorias/disponibilidades', {
    method: 'POST', token: mentor,
    body: { inicio: bookingStart.toISOString(), fim: bookingEnd.toISOString() },
  })
  assert.equal(bookingSlot.status, 201, `horário de agendamento: ${JSON.stringify(bookingSlot.data)}`)
  const bookingResults = await Promise.all([
    request('/mentorias/agendar', { method: 'POST', token: studentOne, body: { disponibilidadeId: bookingSlot.data.id, tema: 'Teste de concorrência' } }),
    request('/mentorias/agendar', { method: 'POST', token: studentTwo, body: { disponibilidadeId: bookingSlot.data.id, tema: 'Teste de concorrência' } }),
  ])
  assert.deepEqual(bookingResults.map(result => result.status).sort(), [201, 409])
  console.log('OK: dois agendamentos simultâneos; apenas um passou (201/409)')

  const winnerIndex = bookingResults.findIndex(result => result.status === 201)
  const winnerToken = winnerIndex === 0 ? studentOne : studentTwo
  const meetingId = bookingResults[winnerIndex].data.id
  const confirmed = await request(`/mentorias/${meetingId}/estado`, {
    method: 'PUT', token: mentor, body: { status: 'CONFIRMADA' },
  })
  assert.equal(confirmed.status, 200)
  assert.equal(confirmed.data.linkReuniao, meetingLink)
  const participantSessions = await request('/mentorias/minhas', { token: winnerToken })
  assert.equal(participantSessions.data.find(item => item.id === meetingId)?.linkReuniao, meetingLink)
  const adminSessions = await request('/mentorias', { token: admin })
  assert.equal(Object.hasOwn(adminSessions.data.find(item => item.id === meetingId), 'linkReuniao'), false)
  console.log('OK: link HTTPS copiado ao confirmar e limitado aos participantes')

  const lisbonUtc = aUTC('2026-01-15', '14:00', 'Europe/Lisbon')
  const luandaUtc = aUTC('2026-01-15', '15:00', 'Africa/Luanda')
  assert.equal(lisbonUtc, luandaUtc, 'Lisboa 14:00 e Luanda 15:00 devem ser o mesmo instante no inverno')
  const lisbonDisplay = formatarDataHora(lisbonUtc, 'pt', 'Europe/Lisbon')
  const luandaDisplay = formatarDataHora(luandaUtc, 'pt', 'Africa/Luanda')
  assert.match(lisbonDisplay, /14:00.*Lisbon/)
  assert.match(luandaDisplay, /15:00.*WAT, Luanda/)
  console.log(`OK: mesmo instante em fusos distintos — ${lisbonDisplay}; ${luandaDisplay}`)
} catch (error) {
  console.error('Falha na verificação UTC:', error)
  process.exitCode = 1
} finally {
  if (httpServer) await new Promise(resolve => httpServer.close(resolve))
  if (prisma) await prisma.$disconnect()
  if (testDir.startsWith(tmpdir())) await rm(testDir, { recursive: true, force: true })
}
