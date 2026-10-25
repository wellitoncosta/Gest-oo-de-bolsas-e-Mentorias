import prisma from '../config/db.js'
import bcrypt from 'bcryptjs'
import { gerarToken } from '../utils/jwt.js'
import { enviarEmail } from '../utils/email.js'
import crypto from 'crypto'

export const registar = async (dados) => {
  const nome = (dados.nome || '').trim()
  const email = (dados.email || '').trim().toLowerCase()
  const senha = dados.senha
  const role = dados.role
  const existe = await prisma.user.findUnique({ where: { email } })
  if (existe) throw { status: 400, message: 'Email já registado' }
  const hash = await bcrypt.hash(senha, 10)
  const userRole = role === 'MENTOR' ? 'MENTOR' : 'ESTUDANTE'
  const user = await prisma.user.create({
    data: { nome, email, senha: hash, role: userRole },
    select: { id: true, nome: true, email: true, role: true }
  })
  const token = gerarToken(user)
  return { user, token }
}

export const login = async (email, senha) => {
  const emailNorm = (email || '').trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email: emailNorm } })
  if (!user) throw { status: 401, message: 'Credenciais inválidas' }
  const ok = await bcrypt.compare(senha, user.senha)
  if (!ok) throw { status: 401, message: 'Credenciais inválidas' }
  if (user.bloqueado) throw { status: 403, message: 'A sua conta foi bloqueada. Contacte o administrador.', codigo: 'CONTA_BLOQUEADA' }
  const token = gerarToken(user)
  const safe = { id: user.id, nome: user.nome, email: user.email, role: user.role }
  return { user: safe, token }
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')

export const pedirRecuperacao = async (email) => {
  const emailNorm = (email || '').trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email: emailNorm } })
  if (!user) throw { status: 404, message: 'Não existe nenhuma conta com este email.' }
  if (user.bloqueado) throw { status: 403, message: 'Esta conta está bloqueada. Contacte o administrador.' }
  const ultimo = await prisma.passwordReset.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })
  if (ultimo && (Date.now() - ultimo.createdAt.getTime()) < 60000) {
    const segundosRestantes = Math.ceil((60000 - (Date.now() - ultimo.createdAt.getTime())) / 1000)
    throw { status: 429, message: `Aguarde ${segundosRestantes} segundos para pedir novo código.`, segundosRestantes }
  }
  await prisma.passwordReset.updateMany({ where: { userId: user.id, used: false }, data: { used: true } })
  const codigo = String(crypto.randomInt(100000, 1000000))
  const codeHash = await bcrypt.hash(codigo, 10)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
  await prisma.passwordReset.create({ data: { userId: user.id, codeHash, expiresAt } })
  try {
    await enviarEmail(emailNorm, 'Recuperação de senha - Gestão de Bolsas e Mentorias', `<p>O seu código de recuperação é: <strong>${codigo}</strong></p><p>Válido por 15 minutos.</p>`, codigo)
  } catch (e) {
    throw { status: 502, message: 'Não foi possível enviar o email. Tente novamente.' }
  }
  return { mensagem: 'Código enviado para o seu email.', segundosReenvio: 60 }
}

export const validarCodigo = async (email, codigo) => {
  const emailNorm = (email || '').trim().toLowerCase()
  const codigoLimpo = (codigo || '').trim()
  const user = await prisma.user.findUnique({ where: { email: emailNorm } })
  if (!user) throw { status: 404, message: 'Não existe nenhuma conta com este email.' }
  if (user.bloqueado) throw { status: 403, message: 'Esta conta está bloqueada. Contacte o administrador.' }
  const reset = await prisma.passwordReset.findFirst({
    where: { userId: user.id, used: false, verificado: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' }
  })
  if (!reset) throw { status: 400, message: 'Código inválido ou expirado' }
  if (reset.attempts >= 5) throw { status: 429, message: 'Limite de tentativas excedido' }
  const ok = await bcrypt.compare(codigoLimpo, reset.codeHash)
  if (!ok) {
    const novos = reset.attempts + 1
    await prisma.passwordReset.update({ where: { id: reset.id }, data: { attempts: novos } })
    const restantes = Math.max(0, 5 - novos)
    throw { status: 400, message: `Código inválido. Restam ${restantes} tentativas` }
  }
  const resetToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = sha256(resetToken)
  const tokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
  await prisma.passwordReset.update({ where: { id: reset.id }, data: { verificado: true, tokenHash, tokenExpiresAt } })
  return { resetToken, mensagem: 'Código validado.' }
}

export const redefinirSenha = async (email, resetToken, novaSenha) => {
  const emailNorm = (email || '').trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email: emailNorm } })
  if (!user) throw { status: 400, message: 'Sessão de recuperação inválida ou expirada. Peça um novo código.' }
  if (!resetToken) throw { status: 400, message: 'Sessão de recuperação inválida ou expirada. Peça um novo código.' }
  const tokenHash = sha256(resetToken)
  const reset = await prisma.passwordReset.findFirst({
    where: { userId: user.id, used: false, verificado: true, tokenHash, tokenExpiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' }
  })
  if (!reset) throw { status: 400, message: 'Sessão de recuperação inválida ou expirada. Peça um novo código.' }
  const hash = await bcrypt.hash(novaSenha, 10)
  await prisma.user.update({ where: { id: user.id }, data: { senha: hash } })
  await prisma.passwordReset.updateMany({ where: { userId: user.id }, data: { used: true } })
  return { mensagem: 'Senha alterada com sucesso' }
}
