import prisma from '../config/db.js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { timezoneValido } from '../utils/datas.js'
import { areas } from '../constants/areas.js'

const linkReuniaoSchema = z.preprocess(
  (value) => (value === '' ? null : value),
  z
    .string()
    .url()
    .refine((value) => value.startsWith('https://'), 'O link deve usar HTTPS.')
    .nullable()
    .optional(),
)

const perfilSchema = z.object({
  nome: z.string().min(2).optional(),
  telefone: z.string().optional(),
  area: z.preprocess((value) => (value === '' ? null : value), z.enum(areas).nullable().optional()),
  biografia: z.string().optional(),
  biografiaEn: z.string().optional().nullable(),
  instituicao: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z
      .string()
      .trim()
      .max(120, 'A instituição deve ter no máximo 120 caracteres.')
      .nullable()
      .optional(),
  ),
  fusoHorario: z.string().refine(timezoneValido, 'Fuso horário inválido').optional(),
  linkReuniao: linkReuniaoSchema,
})

const senhaSchema = z.object({
  atual: z.string().min(1),
  nova: z.string().min(6),
})

const apagarSchema = z.object({
  senha: z.string().min(1, 'Senha atual obrigatória'),
})

export const verPerfil = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        telefone: true,
        area: true,
        biografia: true,
        biografiaEn: true,
        instituicao: true,
        fusoHorario: true,
        linkReuniao: req.user.role === 'MENTOR',
        createdAt: true,
      },
    })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

export const resumoConta = async (req, res, next) => {
  try {
    const userId = req.user.id
    const role = req.user.role
    if (role === 'ADMIN') {
      const [utilizadores, bolsas, candidaturas, mentorias] = await Promise.all([
        prisma.user.count(),
        prisma.bolsa.count(),
        prisma.candidatura.count(),
        prisma.mentoria.count(),
      ])
      return res.json({
        totais: { utilizadores, bolsas, candidaturas, mentorias },
        candidaturas: [],
        mentorias: [],
      })
    }
    const mentor = role === 'MENTOR'
    const [totalCandidaturas, totalMentorias, concluidas, candidaturas, mentorias, avaliacoes] =
      await Promise.all([
        prisma.candidatura.count({ where: { userId } }),
        prisma.mentoria.count({ where: mentor ? { mentorId: userId } : { estudanteId: userId } }),
        prisma.mentoria.count({ where: { mentorId: userId, status: 'CONCLUIDA' } }),
        prisma.candidatura.findMany({
          where: { userId },
          include: { bolsa: { select: { id: true, titulo: true, tituloEn: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.mentoria.findMany({
          where: mentor ? { mentorId: userId } : { estudanteId: userId },
          include: {
            mentor: { select: { nome: true } },
            estudante: { select: { nome: true } },
            disponibilidade: { select: { inicio: true, fim: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.mentoria.aggregate({
          where: { mentorId: userId, avaliacao: { not: null } },
          _avg: { avaliacao: true },
        }),
      ])
    res.json({
      totais: {
        candidaturas: totalCandidaturas,
        mentorias: totalMentorias,
        concluidas,
        avaliacaoMedia: avaliacoes._avg.avaliacao,
      },
      candidaturas,
      mentorias,
    })
  } catch (err) {
    next(err)
  }
}

export const editarPerfil = async (req, res, next) => {
  try {
    const dados = perfilSchema.parse(req.body)
    if (req.user.role !== 'MENTOR') delete dados.linkReuniao
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: dados,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        telefone: true,
        area: true,
        biografia: true,
        biografiaEn: true,
        instituicao: true,
        fusoHorario: true,
        linkReuniao: req.user.role === 'MENTOR',
      },
    })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

export const alterarSenha = async (req, res, next) => {
  try {
    const { atual, nova } = senhaSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    const ok = await bcrypt.compare(atual, user.senha)
    if (!ok)
      return res
        .status(400)
        .json({ mensagem: 'Senha atual incorreta', codigo: 'SENHA_ATUAL_INCORRETA' })
    const hash = await bcrypt.hash(nova, 10)
    await prisma.user.update({ where: { id: req.user.id }, data: { senha: hash } })
    res.json({ mensagem: 'Senha alterada com sucesso', codigo: 'SENHA_ALTERADA' })
  } catch (err) {
    next(err)
  }
}

export const apagarConta = async (req, res, next) => {
  try {
    const { senha } = apagarSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    const ok = await bcrypt.compare(senha, user.senha)
    if (!ok)
      return res
        .status(400)
        .json({ mensagem: 'Senha atual incorreta', codigo: 'SENHA_ATUAL_INCORRETA' })
    if (user.role === 'ADMIN') {
      const admins = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (admins <= 1)
        return res.status(400).json({
          mensagem: 'Não é possível apagar a conta do último administrador',
          codigo: 'ULTIMO_ADMIN',
        })
    }
    await prisma.user.delete({ where: { id: req.user.id } })
    res.clearCookie('token')
    res.json({ mensagem: 'Conta apagada', codigo: 'CONTA_APAGADA' })
  } catch (err) {
    next(err)
  }
}
