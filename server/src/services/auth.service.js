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

export const pedirRecuperacao = async (email) => {
  const emailNorm = (email || '').trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email: emailNorm } })
  if (!user || user.bloqueado) {
    // Resposta genérica
    return { mensagem: 'Se o email existir, será enviado um código de recuperação.' }
  }
  // Invalidar códigos anteriores
  await prisma.passwordReset.updateMany({ where: { userId: user.id, used: false }, data: { used: true } })
  const codigo = String(crypto.randomInt(100000, 1000000))
  const codeHash = await bcrypt.hash(codigo, 10)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
  await prisma.passwordReset.create({ data: { userId: user.id, codeHash, expiresAt } })
  await enviarEmail(emailNorm, 'Recuperação de senha - Gestão de Bolsas e Mentorias', `<p>O seu código de recuperação é: <strong>${codigo}</strong></p><p>Válido por 15 minutos.</p>`, codigo)
  return { mensagem: 'Se o email existir, será enviado um código de recuperação.' }
}

export const verificarRecuperacao = async (email, codigo, novaSenha) => {
  const emailNorm = (email || '').trim().toLowerCase()
  const codigoLimpo = (codigo || '').trim()
  const user = await prisma.user.findUnique({ where: { email: emailNorm } })
  if (!user || user.bloqueado) throw { status: 400, message: 'Código inválido' }
  const reset = await prisma.passwordReset.findFirst({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
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
  const hash = await bcrypt.hash(novaSenha, 10)
  await prisma.user.update({ where: { id: user.id }, data: { senha: hash } })
  await prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } })
  return { mensagem: 'Senha alterada com sucesso' }
}
