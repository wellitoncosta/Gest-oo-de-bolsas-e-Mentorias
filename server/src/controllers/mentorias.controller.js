import prisma from '../config/db.js'
import { z } from 'zod'

const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

const dispSchema = z.object({
  data: z.string().refine((val) => {
    const d = new Date(val)
    return !isNaN(d.getTime())
  }, 'Data inválida').refine((val) => {
    const d = new Date(val)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    d.setHours(0, 0, 0, 0)
    return d >= hoje
  }, 'Não é permitido criar horários no passado'),
  horaInicio: z.string().regex(horaRegex, 'Formato de hora inválido (HH:MM)'),
  horaFim: z.string().regex(horaRegex, 'Formato de hora inválido (HH:MM)')
}).refine((data) => {
  return data.horaFim > data.horaInicio
}, { message: 'Hora de fim deve ser posterior à hora de início', path: ['horaFim'] })

const agendarSchema = z.object({
  disponibilidadeId: z.string(),
  tema: z.string().min(3)
})

const estadoSchema = z.object({
  status: z.enum(['PENDENTE', 'CONFIRMADA', 'RECUSADA', 'CANCELADA', 'CONCLUIDA'])
})

const transicoesPermitidas = {
  MENTOR: {
    PENDENTE: ['CONFIRMADA', 'RECUSADA', 'CANCELADA'],
    CONFIRMADA: ['CONCLUIDA', 'CANCELADA'],
    RECUSADA: [],
    CANCELADA: [],
    CONCLUIDA: []
  },
  ESTUDANTE: {
    PENDENTE: ['CANCELADA'],
    CONFIRMADA: ['CANCELADA'],
    RECUSADA: [],
    CANCELADA: [],
    CONCLUIDA: []
  },
  ADMIN: {
    PENDENTE: ['CONFIRMADA', 'RECUSADA', 'CANCELADA', 'CONCLUIDA'],
    CONFIRMADA: ['CONFIRMADA', 'RECUSADA', 'CANCELADA', 'CONCLUIDA'],
    RECUSADA: ['RECUSADA', 'CANCELADA'],
    CANCELADA: ['CANCELADA'],
    CONCLUIDA: ['CONCLUIDA']
  }
}

export const criarDisponibilidade = async (req, res, next) => {
  try {
    const dados = dispSchema.parse(req.body)
    const dataDisp = new Date(dados.data)
    // Verificar sobreposição
    const existentes = await prisma.disponibilidadeMentor.findMany({ where: { mentorId: req.user.id } })
    const sobrepoe = existentes.some(d => {
      const mesmaData = new Date(d.data).toDateString() === dataDisp.toDateString()
      if (!mesmaData) return false
      return !(dados.horaFim <= d.horaInicio || dados.horaInicio >= d.horaFim)
    })
    if (sobrepoe) return res.status(400).json({ mensagem: 'Horário sobrepõe-se a outro horário existente no mesmo dia' })
    const disp = await prisma.disponibilidadeMentor.create({
      data: { mentorId: req.user.id, data: dataDisp, horaInicio: dados.horaInicio, horaFim: dados.horaFim }
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
    const agora = new Date()
    const resultado = []
    for (const d of disps) {
      const ocupado = d.mentorias.some(m => m.status === 'PENDENTE' || m.status === 'CONFIRMADA')
      const dataDisp = new Date(d.data)
      // considerar passado se data for anterior ou mesma data mas já passou? simples: se data < hoje
      const hoje = new Date()
      hoje.setHours(0,0,0,0)
      const d0 = new Date(dataDisp)
      d0.setHours(0,0,0,0)
      if (ocupado || d0 < hoje) continue
      resultado.push({ id: d.id, mentorId: d.mentorId, data: d.data, horaInicio: d.horaInicio, horaFim: d.horaFim, mentor: d.mentor })
    }
    res.json(resultado)
  } catch (err) { next(err) }
}

export const minhasDisponibilidades = async (req, res, next) => {
  try {
    const disps = await prisma.disponibilidadeMentor.findMany({
      where: { mentorId: req.user.id },
      include: { mentorias: { include: { estudante: { select: { nome: true } } } } },
      orderBy: { data: 'asc' }
    })
    const resultado = disps.map(d => {
      const ocupada = d.mentorias.find(m => m.status === 'PENDENTE' || m.status === 'CONFIRMADA')
      return {
        id: d.id,
        data: d.data,
        horaInicio: d.horaInicio,
        horaFim: d.horaFim,
        status: ocupada ? 'OCUPADO' : 'LIVRE',
        estudanteNome: ocupada ? ocupada.estudante.nome : null
      }
    })
    res.json(resultado)
  } catch (err) { next(err) }
}

export const listarMentores = async (req, res, next) => {
  try {
    const mentores = await prisma.user.findMany({
      where: { role: 'MENTOR' },
      select: { id: true, nome: true, area: true, biografia: true }
    })
    res.json(mentores)
  } catch (err) { next(err) }
}

export const obterMentor = async (req, res, next) => {
  try {
    const mentor = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, nome: true, area: true, biografia: true, role: true }
    })
    if (!mentor || mentor.role !== 'MENTOR') return res.status(404).json({ mensagem: 'Mentor não encontrado' })
    res.json(mentor)
  } catch (err) { next(err) }
}

export const agendar = async (req, res, next) => {
  try {
    const { disponibilidadeId, tema } = agendarSchema.parse(req.body)
    const resultado = await prisma.$transaction(async (tx) => {
      const disp = await tx.disponibilidadeMentor.findUnique({ where: { id: disponibilidadeId }, include: { mentorias: true } })
      if (!disp) throw { status: 404, message: 'Disponibilidade não encontrada' }
      const hoje = new Date()
      hoje.setHours(0,0,0,0)
      const d0 = new Date(disp.data)
      d0.setHours(0,0,0,0)
      if (d0 < hoje) throw { status: 400, message: 'Horário já passou' }
      const ocupado = disp.mentorias.some(m => m.status === 'PENDENTE' || m.status === 'CONFIRMADA')
      if (ocupado) throw { status: 409, message: 'Horário já agendado' }
      const mentoria = await tx.mentoria.create({
        data: { mentorId: disp.mentorId, estudanteId: req.user.id, disponibilidadeId, tema }
      })
      return mentoria
    })
    res.status(201).json(resultado)
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
    const role = req.user.role
    if (role === 'MENTOR') {
      if (mentoria.mentorId !== req.user.id) return res.status(403).json({ mensagem: 'Sem permissão' })
      const permitidas = transicoesPermitidas.MENTOR[mentoria.status] || []
      if (!permitidas.includes(status)) return res.status(400).json({ mensagem: 'Transição inválida' })
    } else if (role === 'ESTUDANTE') {
      if (mentoria.estudanteId !== req.user.id) return res.status(403).json({ mensagem: 'Sem permissão' })
      if (status !== 'CANCELADA') return res.status(403).json({ mensagem: 'Sem permissão' })
      const permitidas = transicoesPermitidas.ESTUDANTE[mentoria.status] || []
      if (!permitidas.includes(status)) return res.status(400).json({ mensagem: 'Transição inválida' })
    } else if (role === 'ADMIN') {
      const permitidas = transicoesPermitidas.ADMIN[mentoria.status] || []
      if (!permitidas.includes(status)) return res.status(400).json({ mensagem: 'Transição inválida' })
    } else {
      return res.status(403).json({ mensagem: 'Sem permissão' })
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
