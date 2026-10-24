import prisma from '../config/db.js'
import bcrypt from 'bcryptjs'
import { gerarToken } from '../utils/jwt.js'
import { enviarEmail } from '../utils/email.js'
import crypto from 'crypto'

export const registar = async (dados) => {
  const { nome, email, senha, role } = dados
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
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw { status: 401, message: 'Credenciais inválidas' }
  const ok = await bcrypt.compare(senha, user.senha)
  if (!ok) throw { status: 401, message: 'Credenciais inválidas' }
  const token = gerarToken(user)
  const safe = { id: user.id, nome: user.nome, email: user.email, role: user.role }
  return { user: safe, token }
}

export const pedirRecuperacao = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    // Resposta genérica
    return { mensagem: 'Se o email existir, será enviado um código de recuperação.' }
  }
  // Invalidar códigos anteriores
  await prisma.passwordReset.updateMany({ where: { userId: user.id, used: false }, data: { used: true } })
  const codigo = String(Math.floor(100000 + Math.random() * 900000))
  const codeHash = await bcrypt.hash(codigo, 10)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
  await prisma.passwordReset.create({ data: { userId: user.id, codeHash, expiresAt } })
  await enviarEmail(email, 'Recuperação de senha - Gestão de Bolsas e Mentorias', `<p>O seu código de recuperação é: <strong>${codigo}</strong></p><p>Válido por 15 minutos.</p>`, codigo)
  return { mensagem: 'Se o email existir, será enviado um código de recuperação.' }
}

export const verificarRecuperacao = async (email, codigo, novaSenha) => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw { status: 400, message: 'Código inválido' }
  const reset = await prisma.passwordReset.findFirst({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' }
  })
  if (!reset) throw { status: 400, message: 'Código inválido ou expirado' }
  if (reset.attempts >= 5) throw { status: 429, message: 'Limite de tentativas excedido' }
  const ok = await bcrypt.compare(codigo, reset.codeHash)
  if (!ok) {
    await prisma.passwordReset.update({ where: { id: reset.id }, data: { attempts: reset.attempts + 1 } })
    throw { status: 400, message: 'Código inválido' }
  }
  const hash = await bcrypt.hash(novaSenha, 10)
  await prisma.user.update({ where: { id: user.id }, data: { senha: hash } })
  await prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } })
  return { mensagem: 'Senha alterada com sucesso' }
}
