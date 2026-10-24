import prisma from '../config/db.js'
import { z } from 'zod'

const schema = z.object({
  titulo: z.string().min(2),
  descricao: z.string().min(5),
  entidade: z.string().min(2),
  valor: z.string().optional(),
  requisitos: z.string().optional(),
  area: z.string().min(2),
  dataLimite: z.string(),
  status: z.enum(['ABERTA', 'FECHADA']).optional()
})

export const listar = async (req, res, next) => {
  try {
    const { search, area, status } = req.query
    const where = {}
    if (status) where.status = status
    if (area) where.area = { contains: area }
    if (search) {
      where.OR = [
        { titulo: { contains: search } },
        { descricao: { contains: search } },
        { entidade: { contains: search } }
      ]
    }
    const bolsas = await prisma.bolsa.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json(bolsas)
  } catch (err) { next(err) }
}

export const obter = async (req, res, next) => {
  try {
    const bolsa = await prisma.bolsa.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { candidaturas: true } } }
    })
    if (!bolsa) return res.status(404).json({ mensagem: 'Bolsa não encontrada' })
    const { _count, ...rest } = bolsa
    res.json({ ...rest, totalCandidaturas: _count.candidaturas })
  } catch (err) { next(err) }
}

export const criar = async (req, res, next) => {
  try {
    const dados = schema.parse(req.body)
    const bolsa = await prisma.bolsa.create({ data: { ...dados, dataLimite: new Date(dados.dataLimite) } })
    res.status(201).json(bolsa)
  } catch (err) { next(err) }
}

export const atualizar = async (req, res, next) => {
  try {
    const dados = schema.partial().parse(req.body)
    if (dados.dataLimite) dados.dataLimite = new Date(dados.dataLimite)
    const bolsa = await prisma.bolsa.update({ where: { id: req.params.id }, data: dados })
    res.json(bolsa)
  } catch (err) { next(err) }
}

export const remover = async (req, res, next) => {
  try {
    await prisma.bolsa.delete({ where: { id: req.params.id } })
    res.json({ mensagem: 'Bolsa removida' })
  } catch (err) { next(err) }
}
