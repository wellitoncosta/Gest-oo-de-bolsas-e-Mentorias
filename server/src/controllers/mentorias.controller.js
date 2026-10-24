import prisma from '../config/db.js'
import { z } from 'zod'

const dispSchema = z.object({
  data: z.string(),
  horaInicio: z.string(),
  horaFim: z.string()
})

const agendarSchema = z.object({
  disponibilidadeId: z.string(),
  tema: z.string().min(3)
})

const estadoSchema = z.object({
  status: z.enum(['CONFIRMADA', 'RECUSADA', 'CANCELADA', 'CONCLUIDA'])
})

export const criarDisponibilidade = async (req, res, next) => {
  try {
    const dados = dispSchema.parse(req.body)
    const disp = await prisma.disponibilidadeMentor.create({
      data: { mentorId: req.user.id, data: new Date(dados.data), horaInicio: dados.horaInicio, horaFim: dados.horaFim }
    })
    res.status(201).json(disp)
  } catch (err) { next(err) }
}

export const listarDisponibilidades = async (req, res, next) => {
  try {
    const { mentorId } = req.query
    const where = {}
    if (mentorId) where.mentorId = mentorId
    const disps = await prisma.disponibilidadeMentor.findMany({
      where,
      include: { mentor: { select: { id: true, nome: true, area: true } }, mentorias: true },
      orderBy: { data: 'asc' }
    })
    // Filtrar apenas livres? mostrar todas mas frontend filtra
    res.json(disps)
  } catch (err) { next(err) }
}

export const listarMentores = async (req, res, next) => {
  try {
    const mentores = await prisma.user.findMany({
      where: { role: 'MENTOR' },
      select: { id: true, nome: true, email: true, area: true, biografia: true, telefone: true }
    })
    res.json(mentores)
  } catch (err) { next(err) }
}

export const obterMentor = async (req, res, next) => {
  try {
    const mentor = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, nome: true, email: true, area: true, biografia: true, telefone: true, role: true }
    })
    if (!mentor || mentor.role !== 'MENTOR') return res.status(404).json({ mensagem: 'Mentor não encontrado' })
    res.json(mentor)
  } catch (err) { next(err) }
}

export const agendar = async (req, res, next) => {
  try {
    const { disponibilidadeId, tema } = agendarSchema.parse(req.body)
    const disp = await prisma.disponibilidadeMentor.findUnique({ where: { id: disponibilidadeId }, include: { mentorias: true } })
    if (!disp) return res.status(404).json({ mensagem: 'Disponibilidade não encontrada' })
    // Verificar conflito
    const ocupado = disp.mentorias.some(m => m.status === 'PENDENTE' || m.status === 'CONFIRMADA')
    if (ocupado) return res.status(400).json({ mensagem: 'Horário já agendado' })
    const mentoria = await prisma.mentoria.create({
      data: { mentorId: disp.mentorId, estudanteId: req.user.id, disponibilidadeId, tema }
    })
    res.status(201).json(mentoria)
  } catch (err) { next(err) }
}

export const minhasMentorias = async (req, res, next) => {
  try {
    const where = req.user.role === 'MENTOR' ? { mentorId: req.user.id } : { estudanteId: req.user.id }
    const mentorias = await prisma.mentoria.findMany({
      where,
      include: {
        mentor: { select: { id: true, nome: true, email: true } },
        estudante: { select: { id: true, nome: true, email: true } },
        disponibilidade: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(mentorias)
  } catch (err) { next(err) }
}

export const atualizarEstadoMentoria = async (req, res, next) => {
  try {
    const { status } = estadoSchema.parse(req.body)
    const mentoria = await prisma.mentoria.findUnique({ where: { id: req.params.id } })
    if (!mentoria) return res.status(404).json({ mensagem: 'Mentoria não encontrada' })
    if (req.user.role === 'MENTOR' && mentoria.mentorId !== req.user.id) return res.status(403).json({ mensagem: 'Sem permissão' })
    if (req.user.role === 'ESTUDANTE' && mentoria.estudanteId !== req.user.id && status !== 'CANCELADA') return res.status(403).json({ mensagem: 'Sem permissão' })
    if (req.user.role === 'ESTUDANTE' && status === 'CANCELADA') {
      // estudante pode cancelar se pendente/confirmada
    }
    const atualizada = await prisma.mentoria.update({ where: { id: req.params.id }, data: { status } })
    res.json(atualizada)
  } catch (err) { next(err) }
}

export const listarTodasMentorias = async (req, res, next) => {
  try {
    const mentorias = await prisma.mentoria.findMany({
      include: {
        mentor: { select: { id: true, nome: true } },
        estudante: { select: { id: true, nome: true } },
        disponibilidade: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(mentorias)
  } catch (err) { next(err) }
}

export const removerDisponibilidade = async (req, res, next) => {
  try {
    const disp = await prisma.disponibilidadeMentor.findUnique({ where: { id: req.params.id }, include: { mentorias: true } })
    if (!disp) return res.status(404).json({ mensagem: 'Disponibilidade não encontrada' })
    if (disp.mentorId !== req.user.id) return res.status(403).json({ mensagem: 'Sem permissão' })
    const ocupado = disp.mentorias.some(m => m.status === 'PENDENTE' || m.status === 'CONFIRMADA')
    if (ocupado) return res.status(400).json({ mensagem: 'Não pode remover disponibilidade com mentoria agendada' })
    await prisma.disponibilidadeMentor.delete({ where: { id: req.params.id } })
    res.json({ mensagem: 'Disponibilidade removida' })
  } catch (err) { next(err) }
}
