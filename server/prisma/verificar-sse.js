import assert from 'node:assert/strict'

const api = (process.env.SSE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const accounts = {
  admin: {
    email: process.env.SSE_TEST_ADMIN_EMAIL || 'admin@demo.com',
    senha: process.env.SSE_TEST_ADMIN_PASSWORD || 'Admin123!',
  },
  estudante: {
    email: process.env.SSE_TEST_STUDENT_EMAIL || 'joao.estudante@demo.com',
    senha: process.env.SSE_TEST_STUDENT_PASSWORD || 'Pass123!',
  },
  outro: {
    email: process.env.SSE_TEST_OTHER_EMAIL || 'maria.estudante@demo.com',
    senha: process.env.SSE_TEST_OTHER_PASSWORD || 'Pass123!',
  },
}

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: {
      ...(token ? { Cookie: `token=${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${data.mensagem || ''}`)
  return data
}

async function login(account) {
  const result = await request('/auth/login', { method: 'POST', body: account })
  return result.token
}

async function abrirSse(token) {
  const response = await fetch(`${api}/eventos`, {
    headers: { Cookie: `token=${token}` },
  })
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type') || '', /text\/event-stream/)
  const reader = response.body.getReader()
  const mensagens = []
  const esperas = []
  let buffer = ''
  let terminou = false

  const notificar = (message) => {
    const index = esperas.findIndex((espera) => espera.evento === message.evento)
    if (index >= 0) esperas.splice(index, 1)[0].resolve(message)
    else mensagens.push(message)
  }
  const ler = async () => {
    const decoder = new TextDecoder()
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const blocos = buffer.split(/\r?\n\r?\n/)
        buffer = blocos.pop() || ''
        for (const bloco of blocos) {
          const lines = bloco.split(/\r?\n/)
          const evento = lines
            .find((line) => line.startsWith('event:'))
            ?.slice(6)
            .trim()
          const dados = lines
            .find((line) => line.startsWith('data:'))
            ?.slice(5)
            .trim()
          if (evento) notificar({ evento, dados: dados ? JSON.parse(dados) : {} })
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'TypeError') throw error
    } finally {
      terminou = true
      for (const espera of esperas.splice(0)) espera.reject(new Error('Fluxo SSE terminou.'))
    }
  }
  void ler()

  return {
    esperar(evento, timeout = 5_000) {
      const index = mensagens.findIndex((message) => message.evento === evento)
      if (index >= 0) return Promise.resolve(mensagens.splice(index, 1)[0])
      if (terminou) return Promise.reject(new Error('Fluxo SSE terminou.'))
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const index = esperas.findIndex((item) => item.resolve === wrappedResolve)
          if (index >= 0) esperas.splice(index, 1)
          reject(new Error(`Evento ${evento} não recebido dentro do prazo.`))
        }, timeout)
        const wrappedResolve = (message) => {
          clearTimeout(timer)
          resolve(message)
        }
        esperas.push({ evento, resolve: wrappedResolve, reject })
      })
    },
    async fechar() {
      try {
        await reader.cancel()
      } catch {
        /* fluxo já encerrado */
      }
    },
  }
}

let adminToken
let estudanteToken
let outroToken
let bolsaId
let adminStream
let estudanteStream
let outroStream

try {
  ;[adminToken, estudanteToken, outroToken] = await Promise.all([
    login(accounts.admin),
    login(accounts.estudante),
    login(accounts.outro),
  ])
  ;[adminStream, estudanteStream, outroStream] = await Promise.all([
    abrirSse(adminToken),
    abrirSse(estudanteToken),
    abrirSse(outroToken),
  ])
  await new Promise((resolve) => setTimeout(resolve, 250))

  const stamp = new Date().toISOString()
  const bolsa = await request('/bolsas', {
    token: adminToken,
    method: 'POST',
    body: {
      titulo: `Verificação SSE ${stamp}`,
      descricao: 'Bolsa temporária criada pelo script de verificação SSE.',
      entidade: 'Teste automatizado',
      area: 'Verificação',
      dataLimite: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    },
  })
  bolsaId = bolsa.id
  const publicEvent = await estudanteStream.esperar('bolsa:criada')
  assert.equal(publicEvent.dados.id, bolsa.id)
  console.log('OK: cliente SSE recebeu bolsa:criada após criação pelo administrador')

  const candidatura = await request(`/candidaturas/bolsa/${bolsa.id}`, {
    token: estudanteToken,
    method: 'POST',
    body: { mensagem: 'Candidatura temporária para verificar privacidade SSE.' },
  })
  await adminStream.esperar('candidatura:nova')
  await assert.rejects(estudanteStream.esperar('candidatura:nova', 500))
  await assert.rejects(outroStream.esperar('candidatura:nova', 500))
  await request(`/candidaturas/${candidatura.id}/estado`, {
    token: adminToken,
    method: 'PUT',
    body: { status: candidatura.status === 'APROVADA' ? 'REJEITADA' : 'APROVADA' },
  })
  await adminStream.esperar('candidatura:estado')
  const ownerEvent = await estudanteStream.esperar('candidatura:estado')
  assert.equal(ownerEvent.dados.id, candidatura.id)
  await assert.rejects(outroStream.esperar('candidatura:estado', 500))
  console.log('OK: candidatura:estado chegou ao dono e não chegou a outro estudante')
} catch (error) {
  console.error(`Falha na verificação SSE: ${error.message}`)
  process.exitCode = 1
} finally {
  if (bolsaId && adminToken) {
    try {
      await request(`/bolsas/${bolsaId}`, { token: adminToken, method: 'DELETE' })
    } catch (error) {
      console.error(`Não foi possível remover a bolsa temporária: ${error.message}`)
    }
  }
  await Promise.all(
    [adminStream, estudanteStream, outroStream].filter(Boolean).map((stream) => stream.fechar()),
  )
}
