import prisma from '../config/db.js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { timezoneValido } from '../utils/datas.js'

const linkReuniaoSchema = z.preprocess(
  value => value === '' ? null : value,
  z.string().url().refine(value => value.startsWith('https://'), 'O link deve usar HTTPS.').nullable().optional(),
)

const perfilSchema = z.object({
  nome: z.string().min(2).optional(),
  telefone: z.string().optional(),
  area: z.string().optional(),
  biografia: z.string().optional(),
  instituicao: z.string().optional(),
  fusoHorario: z.string().refine(timezoneValido, 'Fuso horário inválido').optional(),
  linkReuniao: linkReuniaoSchema,
})

const senhaSchema = z.object({
  atual: z.string().min(1),
  nova: z.string().min(6)
})

const apagarSchema = z.object({
  senha: z.string().min(1, 'Senha atual obrigatória')
})

export const verPerfil = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, nome: true, email: true, role: true, telefone: true, area: true, biografia: true, instituicao: true, fusoHorario: true, linkReuniao: req.user.role === 'MENTOR', createdAt: true } })
    res.json(user)
  } catch (err) { next(err) }
}

export const editarPerfil = async (req, res, next) => {
  try {
    const dados = perfilSchema.parse(req.body)
    if (req.user.role !== 'MENTOR') delete dados.linkReuniao
    const user = await prisma.user.update({ where: { id: req.user.id }, data: dados, select: { id: true, nome: true, email: true, role: true, telefone: true, area: true, biografia: true, instituicao: true, fusoHorario: true, linkReuniao: req.user.role === 'MENTOR' } })
    res.json(user)
  } catch (err) { next(err) }
}

export const alterarSenha = async (req, res, next) => {
  try {
    const { atual, nova } = senhaSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    const ok = await bcrypt.compare(atual, user.senha)
    if (!ok) return res.status(400).json({ mensagem: 'Senha atual incorreta', codigo: 'SENHA_ATUAL_INCORRETA' })
    const hash = await bcrypt.hash(nova, 10)
    await prisma.user.update({ where: { id: req.user.id }, data: { senha: hash } })
    res.json({ mensagem: 'Senha alterada com sucesso', codigo: 'SENHA_ALTERADA' })
  } catch (err) { next(err) }
}

export const apagarConta = async (req, res, next) => {
  try {
    const { senha } = apagarSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    const ok = await bcrypt.compare(senha, user.senha)
    if (!ok) return res.status(400).json({ mensagem: 'Senha atual incorreta', codigo: 'SENHA_ATUAL_INCORRETA' })
    if (user.role === 'ADMIN') {
      const admins = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (admins <= 1) return res.status(400).json({ mensagem: 'Não é possível apagar a conta do último administrador', codigo: 'ULTIMO_ADMIN' })
    }
    await prisma.user.delete({ where: { id: req.user.id } })
    res.clearCookie('token')
    res.json({ mensagem: 'Conta apagada', codigo: 'CONTA_APAGADA' })
  } catch (err) { next(err) }
}
