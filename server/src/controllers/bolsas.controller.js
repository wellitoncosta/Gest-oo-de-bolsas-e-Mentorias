import prisma from '../config/db.js'
import { z } from 'zod'
import { emitirTodos, emitirEstatisticasAlteradas } from '../realtime/hub.js'
import { areas } from '../constants/areas.js'

const bolsaPublica = (bolsa) => ({
  id: bolsa.id,
  titulo: bolsa.titulo,
  tituloEn: bolsa.tituloEn,
  area: bolsa.area,
  entidade: bolsa.entidade,
  status: bolsa.status,
  dataLimite: bolsa.dataLimite,
})

const schema = z.object({
  titulo: z.string().min(2),
  tituloEn: z.string().optional().nullable(),
  descricao: z.string().min(5),
  descricaoEn: z.string().optional().nullable(),
  entidade: z.string().min(2),
  valor: z.string().optional(),
  valorEn: z.string().optional().nullable(),
  requisitos: z.string().optional(),
  requisitosEn: z.string().optional().nullable(),
  area: z.enum(areas),
  dataLimite: z.string(),
  status: z.enum(['ABERTA', 'FECHADA']).optional(),
})

export const listar = async (req, res, next) => {
  try {
    const { search, area, status } = req.query
    const where = {}
    if (status) where.status = status
    if (area) where.area = area
    if (search) {
      where.OR = [
        { titulo: { contains: search } },
        { tituloEn: { contains: search } },
        { descricao: { contains: search } },
        { descricaoEn: { contains: search } },
        { entidade: { contains: search } },
      ]
    }
    const bolsas = await prisma.bolsa.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json(bolsas)
  } catch (err) {
    next(err)
  }
}

export const obter = async (req, res, next) => {
  try {
    const bolsa = await prisma.bolsa.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { candidaturas: true } } },
    })
    if (!bolsa)
      return res
        .status(404)
        .json({ mensagem: 'Bolsa não encontrada', codigo: 'BOLSA_NAO_ENCONTRADA' })
    const { _count, ...rest } = bolsa
    res.json({ ...rest, totalCandidaturas: _count.candidaturas })
  } catch (err) {
    next(err)
  }
}

export const criar = async (req, res, next) => {
  try {
    const dados = schema.parse(req.body)
    const bolsa = await prisma.bolsa.create({
      data: { ...dados, dataLimite: new Date(dados.dataLimite) },
    })
    emitirTodos('bolsa:criada', bolsaPublica(bolsa))
    emitirEstatisticasAlteradas()
    res.status(201).json(bolsa)
  } catch (err) {
    next(err)
  }
}

export const atualizar = async (req, res, next) => {
  try {
    const dados = schema.partial().parse(req.body)
    if (dados.dataLimite) dados.dataLimite = new Date(dados.dataLimite)
    const bolsa = await prisma.bolsa.update({ where: { id: req.params.id }, data: dados })
    emitirTodos('bolsa:atualizada', bolsaPublica(bolsa))
    emitirEstatisticasAlteradas()
    res.json(bolsa)
  } catch (err) {
    next(err)
  }
}

export const remover = async (req, res, next) => {
  try {
    const existente = await prisma.bolsa.findUnique({ where: { id: req.params.id } })
    await prisma.bolsa.delete({ where: { id: req.params.id } })
    emitirTodos('bolsa:removida', { id: req.params.id, titulo: existente?.titulo })
    emitirEstatisticasAlteradas()
    res.json({ mensagem: 'Bolsa removida', codigo: 'BOLSA_REMOVIDA' })
  } catch (err) {
    next(err)
  }
}
