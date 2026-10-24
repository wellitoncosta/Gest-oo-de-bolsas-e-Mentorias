import prisma from '../config/db.js'
import { z } from 'zod'

const candidatarSchema = z.object({ mensagem: z.string().optional() })
const estadoSchema = z.object({ status: z.enum(['PENDENTE', 'APROVADA', 'REJEITADA']) })

export const candidatar = async (req, res, next) => {
  try {
    const { bolsaId } = req.params
    const { mensagem } = candidatarSchema.parse(req.body)
    const bolsa = await prisma.bolsa.findUnique({ where: { id: bolsaId } })
    if (!bolsa) return res.status(404).json({ mensagem: 'Bolsa não encontrada' })
    if (bolsa.status === 'FECHADA') return res.status(400).json({ mensagem: 'Bolsa fechada para candidaturas' })
    const existe = await prisma.candidatura.findUnique({ where: { userId_bolsaId: { userId: req.user.id, bolsaId } } })
    if (existe) return res.status(400).json({ mensagem: 'Já te candidaturas a esta bolsa' })
    const cand = await prisma.candidatura.create({ data: { userId: req.user.id, bolsaId, mensagem } })
    res.status(201).json(cand)
  } catch (err) { next(err) }
}

export const minhasCandidaturas = async (req, res, next) => {
  try {
    const cands = await prisma.candidatura.findMany({
      where: { userId: req.user.id },
      include: { bolsa: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(cands)
  } catch (err) { next(err) }
}

export const listarTodas = async (req, res, next) => {
  try {
    const cands = await prisma.candidatura.findMany({
      include: { user: { select: { id: true, nome: true, email: true } }, bolsa: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(cands)
  } catch (err) { next(err) }
}

export const atualizarEstado = async (req, res, next) => {
  try {
    const { status } = estadoSchema.parse(req.body)
    const cand = await prisma.candidatura.update({ where: { id: req.params.id }, data: { status } })
    res.json(cand)
  } catch (err) { next(err) }
}

export const cancelar = async (req, res, next) => {
  try {
    const cand = await prisma.candidatura.findUnique({ where: { id: req.params.id } })
    if (!cand) return res.status(404).json({ mensagem: 'Candidatura não encontrada' })
    if (cand.userId !== req.user.id) return res.status(403).json({ mensagem: 'Sem permissão' })
    if (cand.status !== 'PENDENTE') return res.status(400).json({ mensagem: 'Apenas candidaturas pendentes podem ser canceladas' })
    await prisma.candidatura.delete({ where: { id: req.params.id } })
    res.json({ mensagem: 'Candidatura cancelada' })
  } catch (err) { next(err) }
}
