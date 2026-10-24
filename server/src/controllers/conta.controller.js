import prisma from '../config/db.js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const perfilSchema = z.object({
  nome: z.string().min(2).optional(),
  telefone: z.string().optional(),
  area: z.string().optional(),
  biografia: z.string().optional(),
  instituicao: z.string().optional()
})

const senhaSchema = z.object({
  atual: z.string().min(1),
  nova: z.string().min(6)
})

export const verPerfil = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, nome: true, email: true, role: true, telefone: true, area: true, biografia: true, instituicao: true, createdAt: true } })
    res.json(user)
  } catch (err) { next(err) }
}

export const editarPerfil = async (req, res, next) => {
  try {
    const dados = perfilSchema.parse(req.body)
    const user = await prisma.user.update({ where: { id: req.user.id }, data: dados, select: { id: true, nome: true, email: true, role: true, telefone: true, area: true, biografia: true, instituicao: true } })
    res.json(user)
  } catch (err) { next(err) }
}

export const alterarSenha = async (req, res, next) => {
  try {
    const { atual, nova } = senhaSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    const ok = await bcrypt.compare(atual, user.senha)
    if (!ok) return res.status(400).json({ mensagem: 'Senha atual incorreta' })
    const hash = await bcrypt.hash(nova, 10)
    await prisma.user.update({ where: { id: req.user.id }, data: { senha: hash } })
    res.json({ mensagem: 'Senha alterada com sucesso' })
  } catch (err) { next(err) }
}

export const apagarConta = async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.user.id } })
    res.clearCookie('token')
    res.json({ mensagem: 'Conta apagada' })
  } catch (err) { next(err) }
}
