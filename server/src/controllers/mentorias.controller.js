import prisma from '../config/db.js'
import { z } from 'zod'
import { camposLegados, paraInstanteUTC } from '../utils/datas.js'
import { disponibilidadeTemColunaAtiva } from '../utils/esquema.js'
import { randomUUID } from 'node:crypto'
import {
  emitirPara,
  emitirParaRole,
  emitirTodos,
  emitirEstatisticasAlteradas,
} from '../realtime/hub.js'

const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
const instanteSchema = z.string().datetime({ offset: false })
const dataSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [ano, mes, dia] = value.split('-').map(Number)
    const data = new Date(Date.UTC(ano, mes - 1, dia))
    return (
      data.getUTCFullYear() === ano && data.getUTCMonth() + 1 === mes && data.getUTCDate() === dia
    )
  }, 'Data inválida.')
const dispSchema = z
  .object({
    inicio: instanteSchema.optional(),
    fim: instanteSchema.optional(),
    data: dataSchema.optional(),
    horaInicio: z.string().regex(horaRegex).optional(),
    horaFim: z.string().regex(horaRegex).optional(),
  })
  .superRefine((value, ctx) => {
    const modern = value.inicio && value.fim
    const legacy = value.data && value.horaInicio && value.horaFim
    if (!modern && !legacy)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Envie inicio/fim ou os campos legados.',
      })
    if (Boolean(value.inicio) !== Boolean(value.fim))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'inicio e fim são obrigatórios em conjunto.',
      })
    if (Boolean(value.data) !== Boolean(value.horaInicio && value.horaFim))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Os campos legados devem ser enviados em conjunto.',
      })
  })

const agendarSchema = z.object({
  disponibilidadeId: z.string(),
  tema: z.string().min(3),
  bolsaId: z.string().optional().nullable(),
})

const estadoSchema = z.object({
  status: z.enum(['PENDENTE', 'CONFIRMADA', 'RECUSADA', 'CANCELADA', 'CONCLUIDA']),
  reabrirHorario: z.boolean().optional().default(true),
})
const avaliacaoSchema = z.object({
  avaliacao: z.number().int().min(1).max(5),
  comentarioAvaliacao: z.string().max(1000).optional().nullable(),
})

const transicoesPermitidas = {
  MENTOR: {
    PENDENTE: ['CONFIRMADA', 'RECUSADA', 'CANCELADA'],
    CONFIRMADA: ['CONCLUIDA', 'CANCELADA'],
    RECUSADA: [],
    CANCELADA: [],
    CONCLUIDA: [],
  },
  ESTUDANTE: {
    PENDENTE: ['CANCELADA'],
    CONFIRMADA: ['CANCELADA'],
    RECUSADA: [],
    CANCELADA: [],
    CONCLUIDA: [],
  },
  ADMIN: {
    PENDENTE: ['CONFIRMADA', 'RECUSADA', 'CANCELADA', 'CONCLUIDA'],
    CONFIRMADA: ['CONFIRMADA', 'RECUSADA', 'CANCELADA', 'CONCLUIDA'],
    RECUSADA: ['RECUSADA', 'CANCELADA'],
    CANCELADA: ['CANCELADA'],
    CONCLUIDA: ['CONCLUIDA'],
  },
}

export const criarDisponibilidade = async (req, res, next) => {
  try {
    const dados = dispSchema.parse(req.body)
    const inicio = dados.inicio
      ? new Date(dados.inicio)
      : paraInstanteUTC(dados.data, dados.horaInicio)
    const fim = dados.fim
      ? new Date(dados.fim)
      : paraInstanteUTC(dados.data.slice(0, 10), dados.horaFim)
    if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fim.getTime()) || fim <= inicio) {
      return res
        .status(400)
        .json({ mensagem: 'O fim deve ser posterior ao início.', codigo: 'INTERVALO_INVALIDO' })
    }
    const duracao = (fim.getTime() - inicio.getTime()) / 60000
    if (duracao < 15 || duracao > 240)
      return res.status(400).json({
        mensagem: 'A duração deve ser entre 15 minutos e 4 horas.',
        codigo: 'DURACAO_INVALIDA',
      })
    if (inicio < new Date())
      return res.status(400).json({ mensagem: 'Horário já passou', codigo: 'HORARIO_PASSADO' })
    const temColunaAtiva = await disponibilidadeTemColunaAtiva()
    const sobrepoe = await prisma.disponibilidadeMentor.findFirst({
      where: {
        mentorId: req.user.id,
        ...(temColunaAtiva ? { ativa: true } : {}),
        inicio: { lt: fim },
        fim: { gt: inicio },
      },
      select: { id: true },
    })
    if (sobrepoe)
      return res.status(409).json({
        mensagem: 'Horário sobrepõe-se a outro horário existente.',
        codigo: 'HORARIO_SOBREPOSTO',
      })
    const inicioLegado = camposLegados(inicio)
    const fimLegado = camposLegados(fim)
    const campos = {
      mentorId: req.user.id,
      inicio,
      fim,
      data: inicioLegado.data,
      horaInicio: inicioLegado.hora,
      horaFim: fimLegado.hora,
    }
    const disp = temColunaAtiva
      ? await prisma.disponibilidadeMentor.create({
          data: {
            ...campos,
          },
          select: {
            id: true,
            mentorId: true,
            data: true,
            horaInicio: true,
            horaFim: true,
            inicio: true,
            fim: true,
            ...(temColunaAtiva ? { ativa: true } : {}),
          },
        })
      : await (async () => {
          const id = randomUUID()
          await prisma.$executeRaw`INSERT INTO "DisponibilidadeMentor" ("id", "mentorId", "inicio", "fim", "data", "horaInicio", "horaFim") VALUES (${id}, ${req.user.id}, ${inicio}, ${fim}, ${inicioLegado.data}, ${inicioLegado.hora}, ${fimLegado.hora})`
          return { id, ...campos }
        })()
    emitirTodos('disponibilidade:alterada', { mentorId: req.user.id })
    res.status(201).json(disp)
  } catch (err) {
    next(err)
  }
}

export const listarDisponibilidades = async (req, res, next) => {
  try {
    const { mentorId } = req.query
    const temColunaAtiva = await disponibilidadeTemColunaAtiva()
    const where = temColunaAtiva ? { ativa: true } : {}
    if (mentorId) where.mentorId = mentorId
    const disps = await prisma.disponibilidadeMentor.findMany({
      where,
      select: {
        id: true,
        mentorId: true,
        data: true,
        horaInicio: true,
        horaFim: true,
        inicio: true,
        fim: true,
        mentor: { select: { id: true, nome: true, area: true, bloqueado: true } },
        mentorias: { select: { status: true } },
      },
      orderBy: { inicio: 'asc' },
    })
    const agora = new Date()
    const resultado = []
    for (const d of disps) {
      if (d.mentor?.bloqueado) continue
      const ocupado = d.mentorias.some((m) => m.status === 'PENDENTE' || m.status === 'CONFIRMADA')
      if (ocupado || d.inicio <= agora) continue
      resultado.push({
        id: d.id,
        mentorId: d.mentorId,
        data: d.data,
        horaInicio: d.horaInicio,
        horaFim: d.horaFim,
        inicio: d.inicio,
        fim: d.fim,
        mentor: { id: d.mentor.id, nome: d.mentor.nome, area: d.mentor.area },
      })
    }
    res.json(resultado)
  } catch (err) {
    next(err)
  }
}

export const minhasDisponibilidades = async (req, res, next) => {
  try {
    const temColunaAtiva = await disponibilidadeTemColunaAtiva()
    const disps = await prisma.disponibilidadeMentor.findMany({
      where: { mentorId: req.user.id },
      select: {
        id: true,
        data: true,
        horaInicio: true,
        horaFim: true,
        inicio: true,
        fim: true,
        ...(temColunaAtiva ? { ativa: true } : {}),
        mentorias: {
          select: { status: true, tema: true, estudante: { select: { nome: true } } },
        },
      },
      orderBy: { inicio: 'asc' },
    })
    const resultado = disps.map((d) => {
      const ocupada = d.mentorias.find((m) => m.status === 'PENDENTE' || m.status === 'CONFIRMADA')
      return {
        id: d.id,
        data: d.data,
        horaInicio: d.horaInicio,
        horaFim: d.horaFim,
        inicio: d.inicio,
        fim: d.fim,
        status: temColunaAtiva && !d.ativa ? 'FECHADO' : ocupada ? 'OCUPADO' : 'LIVRE',
        estudanteNome: ocupada ? ocupada.estudante.nome : null,
        tema: ocupada?.tema || null,
        statusMentoria: ocupada?.status || null,
        ativa: temColunaAtiva ? d.ativa : true,
        temHistorico: d.mentorias.length > 0,
      }
    })
    res.json(resultado)
  } catch (err) {
    next(err)
  }
}

export const listarMentores = async (req, res, next) => {
  try {
    const [mentores, sessoes, avaliacoes] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'MENTOR', bloqueado: false },
        select: { id: true, nome: true, area: true, biografia: true, biografiaEn: true },
      }),
      prisma.mentoria.findMany({
        where: { status: 'CONCLUIDA' },
        select: { mentorId: true, avaliacao: true },
      }),
      prisma.mentoria.findMany({
        where: { status: 'CONCLUIDA', avaliacao: { not: null } },
        select: { mentorId: true, avaliacao: true },
      }),
    ])
    const stats = new Map()
    for (const mentor of mentores)
      stats.set(mentor.id, { totalSessoes: 0, totalAvaliacoes: 0, somaAvaliacoes: 0 })
    for (const sessao of sessoes)
      if (stats.has(sessao.mentorId)) stats.get(sessao.mentorId).totalSessoes += 1
    for (const item of avaliacoes)
      if (stats.has(item.mentorId)) {
        const stat = stats.get(item.mentorId)
        stat.totalAvaliacoes += 1
        stat.somaAvaliacoes += item.avaliacao
      }
    res.json(
      mentores.map((mentor) => {
        const stat = stats.get(mentor.id)
        return {
          ...mentor,
          totalSessoes: stat.totalSessoes,
          totalAvaliacoes: stat.totalAvaliacoes,
          avaliacaoMedia: stat.totalAvaliacoes ? stat.somaAvaliacoes / stat.totalAvaliacoes : null,
        }
      }),
    )
  } catch (err) {
    next(err)
  }
}

export const avaliarMentoria = async (req, res, next) => {
  try {
    const dados = avaliacaoSchema.parse(req.body)
    const mentoria = await prisma.mentoria.findUnique({ where: { id: req.params.id } })
    if (!mentoria)
      return res
        .status(404)
        .json({ mensagem: 'Mentoria não encontrada', codigo: 'MENTORIA_NAO_ENCONTRADA' })
    if (mentoria.estudanteId !== req.user.id)
      return res.status(403).json({ mensagem: 'Sem permissão', codigo: 'SEM_PERMISSAO' })
    if (mentoria.status !== 'CONCLUIDA')
      return res.status(400).json({
        mensagem: 'Só é possível avaliar uma sessão concluída.',
        codigo: 'MENTORIA_NAO_CONCLUIDA',
      })
    const atualizada = await prisma.mentoria.update({ where: { id: mentoria.id }, data: dados })
    emitirPara(mentoria.mentorId, 'mentoria:avaliada', {
      id: mentoria.id,
      mentorId: mentoria.mentorId,
      avaliacao: dados.avaliacao,
    })
    emitirEstatisticasAlteradas()
    res.json({
      id: atualizada.id,
      avaliacao: atualizada.avaliacao,
      comentarioAvaliacao: atualizada.comentarioAvaliacao,
    })
  } catch (err) {
    next(err)
  }
}

export const obterMentor = async (req, res, next) => {
  try {
    const mentor = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        nome: true,
        area: true,
        biografia: true,
        biografiaEn: true,
        role: true,
        bloqueado: true,
      },
    })
    if (!mentor || mentor.role !== 'MENTOR' || mentor.bloqueado)
      return res
        .status(404)
        .json({ mensagem: 'Mentor não encontrado', codigo: 'MENTOR_NAO_ENCONTRADO' })
    res.json({
      id: mentor.id,
      nome: mentor.nome,
      area: mentor.area,
      biografia: mentor.biografia,
      biografiaEn: mentor.biografiaEn,
    })
  } catch (err) {
    next(err)
  }
}

export const agendar = async (req, res, next) => {
  try {
    const { disponibilidadeId, tema, bolsaId } = agendarSchema.parse(req.body)
    const temColunaAtiva = await disponibilidadeTemColunaAtiva()
    const resultado = await prisma.$transaction(async (tx) => {
      // Claim the SQLite write lock before checking occupancy so simultaneous bookings serialize.
      await tx.$executeRaw`UPDATE "DisponibilidadeMentor" SET "inicio" = "inicio" WHERE "id" = ${disponibilidadeId}`
      const disp = await tx.disponibilidadeMentor.findUnique({
        where: { id: disponibilidadeId },
        select: {
          id: true,
          mentorId: true,
          inicio: true,
          ...(temColunaAtiva ? { ativa: true } : {}),
          mentorias: { select: { status: true } },
          mentor: { select: { bloqueado: true } },
        },
      })
      if (!disp)
        throw {
          status: 404,
          message: 'Disponibilidade não encontrada',
          codigo: 'DISPONIBILIDADE_NAO_ENCONTRADA',
        }
      if (temColunaAtiva && !disp.ativa)
        throw {
          status: 404,
          message: 'Disponibilidade não encontrada',
          codigo: 'DISPONIBILIDADE_NAO_ENCONTRADA',
        }
      if (disp.mentor?.bloqueado)
        throw {
          status: 403,
          message: 'Não é possível agendar com este mentor',
          codigo: 'MENTOR_NAO_DISPONIVEL',
        }
      const agora = new Date()
      if (disp.inicio <= agora)
        throw { status: 400, message: 'Horário já passou', codigo: 'HORARIO_PASSADO' }
      if (bolsaId) {
        const bolsa = await tx.bolsa.findUnique({ where: { id: bolsaId }, select: { id: true } })
        if (!bolsa)
          throw { status: 404, message: 'Bolsa não encontrada', codigo: 'BOLSA_NAO_ENCONTRADA' }
        const candidatura = await tx.candidatura.findFirst({
          where: { userId: req.user.id, bolsaId, status: 'APROVADA' },
          select: { id: true },
        })
        if (!candidatura)
          throw {
            status: 403,
            message: 'É necessária uma candidatura aprovada nesta bolsa.',
            codigo: 'CANDIDATURA_NAO_APROVADA',
          }
      }
      const ocupado = disp.mentorias.some(
        (m) => m.status === 'PENDENTE' || m.status === 'CONFIRMADA',
      )
      if (ocupado) throw { status: 409, message: 'Horário já agendado', codigo: 'HORARIO_OCUPADO' }
      try {
        const mentoria = await tx.mentoria.create({
          data: {
            mentorId: disp.mentorId,
            estudanteId: req.user.id,
            disponibilidadeId,
            tema,
            bolsaId: bolsaId || null,
          },
        })
        return mentoria
      } catch (e) {
        throw { status: 409, message: 'Horário já agendado', codigo: 'HORARIO_OCUPADO' }
      }
    })
    const evento = {
      id: resultado.id,
      mentorId: resultado.mentorId,
      estudanteId: resultado.estudanteId,
      status: resultado.status,
    }
    emitirPara(resultado.mentorId, 'mentoria:nova', evento)
    emitirPara(resultado.estudanteId, 'mentoria:nova', evento)
    emitirParaRole('ADMIN', 'mentoria:nova', evento)
    emitirTodos('disponibilidade:alterada', { mentorId: resultado.mentorId })
    emitirEstatisticasAlteradas()
    res.status(201).json(resultado)
  } catch (err) {
    if (
      ['P2034', 'P1008'].includes(err.code) ||
      /database is locked|write conflict/i.test(err.message || '')
    ) {
      return res.status(409).json({ mensagem: 'Horário já agendado', codigo: 'HORARIO_OCUPADO' })
    }
    next(err)
  }
}

export const minhasMentorias = async (req, res, next) => {
  try {
    const where =
      req.user.role === 'MENTOR' ? { mentorId: req.user.id } : { estudanteId: req.user.id }
    const mentorias = await prisma.mentoria.findMany({
      where,
      include: {
        mentor: { select: { id: true, nome: true } },
        estudante: { select: { id: true, nome: true } },
        disponibilidade: {
          select: {
            id: true,
            mentorId: true,
            data: true,
            horaInicio: true,
            horaFim: true,
            inicio: true,
            fim: true,
          },
        },
        bolsa: { select: { id: true, titulo: true, tituloEn: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(mentorias.map(({ linkReuniao, ...mentoria }) => ({ ...mentoria, linkReuniao })))
  } catch (err) {
    next(err)
  }
}

export const atualizarEstadoMentoria = async (req, res, next) => {
  try {
    const { status, reabrirHorario } = estadoSchema.parse(req.body)
    const mentoria = await prisma.mentoria.findUnique({ where: { id: req.params.id } })
    if (!mentoria)
      return res
        .status(404)
        .json({ mensagem: 'Mentoria não encontrada', codigo: 'MENTORIA_NAO_ENCONTRADA' })
    const role = req.user.role
    if (role === 'MENTOR') {
      if (mentoria.mentorId !== req.user.id)
        return res.status(403).json({ mensagem: 'Sem permissão', codigo: 'SEM_PERMISSAO' })
      const permitidas = transicoesPermitidas.MENTOR[mentoria.status] || []
      if (!permitidas.includes(status))
        return res
          .status(400)
          .json({ mensagem: 'Transição inválida', codigo: 'TRANSICAO_INVALIDA' })
    } else if (role === 'ESTUDANTE') {
      if (mentoria.estudanteId !== req.user.id)
        return res.status(403).json({ mensagem: 'Sem permissão', codigo: 'SEM_PERMISSAO' })
      if (status !== 'CANCELADA')
        return res.status(403).json({ mensagem: 'Sem permissão', codigo: 'SEM_PERMISSAO' })
      const permitidas = transicoesPermitidas.ESTUDANTE[mentoria.status] || []
      if (!permitidas.includes(status))
        return res
          .status(400)
          .json({ mensagem: 'Transição inválida', codigo: 'TRANSICAO_INVALIDA' })
    } else if (role === 'ADMIN') {
      const permitidas = transicoesPermitidas.ADMIN[mentoria.status] || []
      if (!permitidas.includes(status))
        return res
          .status(400)
          .json({ mensagem: 'Transição inválida', codigo: 'TRANSICAO_INVALIDA' })
    } else {
      return res.status(403).json({ mensagem: 'Sem permissão', codigo: 'SEM_PERMISSAO' })
    }
    const temColunaAtiva =
      role === 'MENTOR' && status === 'CANCELADA' ? await disponibilidadeTemColunaAtiva() : false
    if (role === 'MENTOR' && status === 'CANCELADA' && !temColunaAtiva && !reabrirHorario)
      return res.status(503).json({
        mensagem: 'Atualize a base de dados para poder fechar este horário.',
        codigo: 'BASE_REQUER_MIGRACAO',
      })
    const dadosAtualizacao = { status }
    if (status === 'CONFIRMADA') {
      const mentor = await prisma.user.findUnique({
        where: { id: mentoria.mentorId },
        select: { linkReuniao: true },
      })
      dadosAtualizacao.linkReuniao = mentor?.linkReuniao || null
    }
    const atualizada = await prisma.$transaction(async (tx) => {
      const updated = await tx.mentoria.update({
        where: { id: req.params.id },
        data: dadosAtualizacao,
      })
      if (role === 'MENTOR' && status === 'CANCELADA' && temColunaAtiva) {
        await tx.disponibilidadeMentor.update({
          where: { id: mentoria.disponibilidadeId },
          data: { ativa: reabrirHorario },
        })
      }
      return updated
    })
    const evento = {
      id: atualizada.id,
      mentorId: atualizada.mentorId,
      estudanteId: atualizada.estudanteId,
      status: atualizada.status,
    }
    emitirPara(atualizada.mentorId, 'mentoria:estado', evento)
    emitirPara(atualizada.estudanteId, 'mentoria:estado', evento)
    emitirParaRole('ADMIN', 'mentoria:estado', evento)
    emitirTodos('disponibilidade:alterada', { mentorId: atualizada.mentorId })
    emitirEstatisticasAlteradas()
    if (role === 'ADMIN') delete atualizada.linkReuniao
    res.json(atualizada)
  } catch (err) {
    next(err)
  }
}

export const listarTodasMentorias = async (req, res, next) => {
  try {
    const mentorias = await prisma.mentoria.findMany({
      include: {
        mentor: { select: { id: true, nome: true } },
        estudante: { select: { id: true, nome: true } },
        disponibilidade: {
          select: {
            id: true,
            mentorId: true,
            data: true,
            horaInicio: true,
            horaFim: true,
            inicio: true,
            fim: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(mentorias.map(({ linkReuniao, ...mentoria }) => mentoria))
  } catch (err) {
    next(err)
  }
}

export const removerDisponibilidade = async (req, res, next) => {
  try {
    const temColunaAtiva = await disponibilidadeTemColunaAtiva()
    const disp = await prisma.disponibilidadeMentor.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        mentorId: true,
        mentorias: { select: { status: true } },
      },
    })
    if (!disp)
      return res.status(404).json({
        mensagem: 'Disponibilidade não encontrada',
        codigo: 'DISPONIBILIDADE_NAO_ENCONTRADA',
      })
    if (disp.mentorId !== req.user.id)
      return res.status(403).json({ mensagem: 'Sem permissão', codigo: 'SEM_PERMISSAO' })
    const temSessaoAtiva = disp.mentorias.some(
      (mentoria) => mentoria.status === 'PENDENTE' || mentoria.status === 'CONFIRMADA',
    )
    if (temSessaoAtiva)
      return res.status(400).json({
        mensagem: 'Cancele a sessão antes de fechar o horário.',
        codigo: 'HORARIO_OCUPADO',
      })
    if (disp.mentorias.length) {
      if (!temColunaAtiva)
        return res.status(503).json({
          mensagem: 'Atualize a base de dados para fechar um horário com histórico.',
          codigo: 'BASE_REQUER_MIGRACAO',
        })
      await prisma.disponibilidadeMentor.update({
        where: { id: req.params.id },
        data: { ativa: false },
      })
    } else {
      await prisma.disponibilidadeMentor.delete({ where: { id: req.params.id } })
    }
    emitirTodos('disponibilidade:alterada', { mentorId: disp.mentorId })
    res.json(
      disp.mentorias.length
        ? { mensagem: 'Disponibilidade fechada', codigo: 'DISPONIBILIDADE_FECHADA' }
        : { mensagem: 'Disponibilidade removida', codigo: 'DISPONIBILIDADE_REMOVIDA' },
    )
  } catch (err) {
    next(err)
  }
}
