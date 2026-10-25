const apiBase = (process.env.DASHBOARD_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const perfiles = [
  ['admin', 'ADMIN'],
  ['mentor', 'MENTOR'],
  ['estudante', 'ESTUDANTE'],
]

async function loginPerfil(nome) {
  const prefixo = `DASHBOARD_${nome.toUpperCase()}`
  const token = process.env[`${prefixo}_TOKEN`]
  if (token) return { authorization: `Bearer ${token}` }
  const email = process.env[`${prefixo}_EMAIL`]
  const senha = process.env[`${prefixo}_PASSWORD`]
  if (!email || !senha) return null
  const response = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  })
  if (!response.ok) throw new Error(`Login de ${nome} falhou com HTTP ${response.status}`)
  const setCookie = response.headers.get('set-cookie')
  if (!setCookie) throw new Error(`O login de ${nome} não devolveu cookie de sessão`)
  return { cookie: setCookie.split(';', 1)[0] }
}

async function verificar(nome, headers = {}, expectedRole) {
  const response = await fetch(`${apiBase}/dashboard/resumo`, { headers })
  const body = await response.json()
  if (!response.ok) throw new Error(`${nome}: endpoint respondeu HTTP ${response.status}: ${body.mensagem || 'erro'}`)
  if (expectedRole && body.role !== expectedRole) throw new Error(`${nome}: perfil esperado ${expectedRole}, recebido ${body.role}`)
  const keys = Object.keys(body)
  console.log(`${nome}: ${keys.join(', ')}`)
  for (const [key, value] of Object.entries(body)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) console.log(`  ${key}: ${Object.keys(value).join(', ')}`)
  }
}

try {
  await verificar('sem sessão')
  let perfisEmFalta = 0
  for (const [nome] of perfiles) {
    const headers = await loginPerfil(nome)
    if (!headers) {
      perfisEmFalta += 1
      console.log(`${nome}: ignorado; defina DASHBOARD_${nome.toUpperCase()}_TOKEN ou as variáveis EMAIL/PASSWORD para testar este perfil.`)
      continue
    }
    await verificar(nome, headers, nome === 'admin' ? 'ADMIN' : nome === 'mentor' ? 'MENTOR' : 'ESTUDANTE')
  }
  if (perfisEmFalta) console.log(`Faltam credenciais de teste para ${perfisEmFalta} perfil(is).`)
} catch (error) {
  console.error(`Verificação do dashboard falhou: ${error.message}`)
  process.exitCode = 1
}
