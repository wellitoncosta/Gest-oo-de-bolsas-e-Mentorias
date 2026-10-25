import prisma from '../config/db.js'

const HORA = 60 * 60 * 1000
const DIA = 24 * HORA
const areasRelacionadas = {
  tecnologia: ['engenharia'],
  engenharia: ['tecnologia'],
  gestao: ['ciencias'],
  ciencias: ['gestao'],
}
const iniciarMesUTC = (data) => new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), 1))
const deslocarMes = (data, quantidade) =>
  new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + quantidade, 1))
const inicioSemanaUTC = (data) => {
  const dia = (data.getUTCDay() + 6) % 7
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate() - dia))
}
const variarCriados = async (model, where = {}) => {
  const agora = new Date()
  const atual = new Date(agora.getTime() - 30 * DIA)
  const anterior = new Date(agora.getTime() - 60 * DIA)
  const [recentes, anteriores] = await Promise.all([
    model.count({ where: { ...where, createdAt: { gte: atual, lte: agora } } }),
    model.count({ where: { ...where, createdAt: { gte: anterior, lt: atual } } }),
  ])
  return { atual: recentes, anterior: anteriores, diferenca: recentes - anteriores }
}

function obterInicioSemanaLocal(data, timeZone = 'Africa/Luanda') {
  let fuso = timeZone || 'Africa/Luanda'
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: fuso }).format(data)
  } catch {
    fuso = 'Africa/Luanda'
  }
  let partes
  try {
    partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: fuso,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(data)
      .reduce((acc, parte) => ({ ...acc, [parte.type]: parte.value }), {})
  } catch {
    partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Luanda',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(data)
      .reduce((acc, parte) => ({ ...acc, [parte.type]: parte.value }), {})
  }
  const localMeiaNoite = new Date(
    Date.UTC(Number(partes.year), Number(partes.month) - 1, Number(partes.day)),
  )
  const diaSemana = (localMeiaNoite.getUTCDay() + 6) % 7
  const segundaLocal = new Date(localMeiaNoite.getTime() - diaSemana * DIA)
  const aplicarFuso = (instante) => {
    const formatado = new Intl.DateTimeFormat('en-GB', {
      timeZone: fuso,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instante)
      .reduce((acc, parte) => ({ ...acc, [parte.type]: parte.value }), {})
    const localComoUTC = Date.UTC(
      Number(formatado.year),
      Number(formatado.month) - 1,
      Number(formatado.day),
      Number(formatado.hour),
      Number(formatado.minute),
      Number(formatado.second),
    )
    return localComoUTC - instante.getTime()
  }
  let utc = new Date(segundaLocal.getTime() - aplicarFuso(segundaLocal))
  utc = new Date(segundaLocal.getTime() - aplicarFuso(utc))
  return utc
}

const somaHoras = (mentorias) =>
  mentorias.reduce((total, mentoria) => {
    const inicio = mentoria.disponibilidade?.inicio
    const fim = mentoria.disponibilidade?.fim
    return inicio && fim ? total + Math.max(0, fim.getTime() - inicio.getTime()) / HORA : total
  }, 0)

export const resumo = async (req, res, next) => {
  try {
    const agora = new Date()
    const ha30Dias = new Date(agora.getTime() + 30 * DIA)
    const seteDiasAtras = new Date(agora.getTime() - 7 * DIA)
    const inicioSemana = obterInicioSemanaLocal(agora, req.user?.fusoHorario)
    const fimSemana = new Date(inicioSemana.getTime() + 7 * DIA)
    const basePublica = {
      role: req.user?.role || 'VISITANTE',
      geradoEm: agora.toISOString(),
      publico: null,
    }

    const [bolsasAbertas, mentores, mentoriasRealizadas, estudantes, bolsasRecentes] =
      await Promise.all([
        prisma.bolsa.count({ where: { status: 'ABERTA', dataLimite: { gte: agora } } }),
        prisma.user.count({ where: { role: 'MENTOR', bloqueado: false } }),
        prisma.mentoria.count({ where: { status: 'CONCLUIDA' } }),
        prisma.user.count({ where: { role: 'ESTUDANTE', bloqueado: false } }),
        prisma.bolsa.findMany({
          where: { createdAt: { gte: deslocarMes(iniciarMesUTC(agora), -5) } },
          select: { createdAt: true },
        }),
      ])
    const serieBolsasPublica = Array.from({ length: 6 }, (_, indice) => {
      const mes = deslocarMes(iniciarMesUTC(agora), indice - 5)
      return {
        mes: mes.toISOString(),
        total: bolsasRecentes.filter(
          (bolsa) => bolsa.createdAt >= mes && bolsa.createdAt < deslocarMes(mes, 1),
        ).length,
      }
    })
    const [variacaoBolsas, variacaoMentores, variacaoMentorias, variacaoEstudantes] =
      await Promise.all([
        variarCriados(prisma.bolsa, { status: 'ABERTA', dataLimite: { gte: agora } }),
        variarCriados(prisma.user, { role: 'MENTOR', bloqueado: false }),
        variarCriados(prisma.mentoria, { status: 'CONCLUIDA' }),
        variarCriados(prisma.user, { role: 'ESTUDANTE', bloqueado: false }),
      ])
    basePublica.publico = {
      totais: { bolsasAbertas, mentores, mentoriasRealizadas, estudantes },
      variacoes: {
        bolsasAbertas: variacaoBolsas,
        mentores: variacaoMentores,
        mentoriasRealizadas: variacaoMentorias,
        estudantes: variacaoEstudantes,
      },
      bolsasPublicadasPorMes: serieBolsasPublica,
    }

    if (!req.user) return res.json(basePublica)

    if (req.user.role === 'ESTUDANTE') {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          nome: true,
          area: true,
          instituicao: true,
          biografia: true,
          telefone: true,
          email: true,
          createdAt: true,
          fusoHorario: true,
        },
      })
      const [
        candidaturas,
        candidaturasAtivas,
        candidaturasAprovadas,
        sessaoSemana,
        proximaSessao,
        prazosDoMes,
        prazosFuturos,
        mentoriasDoEstudante,
      ] = await Promise.all([
        prisma.candidatura.findMany({
          where: { userId: req.user.id },
          include: { bolsa: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.candidatura.count({
          where: { userId: req.user.id, status: { in: ['PENDENTE', 'EM_ANALISE'] } },
        }),
        prisma.candidatura.count({ where: { userId: req.user.id, status: 'APROVADA' } }),
        prisma.mentoria.count({
          where: {
            estudanteId: req.user.id,
            status: { in: ['PENDENTE', 'CONFIRMADA'] },
            disponibilidade: { inicio: { gte: inicioSemana, lt: fimSemana } },
          },
        }),
        prisma.mentoria.findFirst({
          where: {
            estudanteId: req.user.id,
            status: 'CONFIRMADA',
            disponibilidade: { inicio: { gte: agora } },
          },
          include: { mentor: { select: { id: true, nome: true } }, disponibilidade: true },
          orderBy: { disponibilidade: { inicio: 'asc' } },
        }),
        prisma.bolsa.findMany({
          where: { status: 'ABERTA', dataLimite: { gte: agora, lte: ha30Dias } },
          orderBy: { dataLimite: 'asc' },
          take: 6,
        }),
        prisma.bolsa.findMany({
          where: { status: 'ABERTA', dataLimite: { gt: ha30Dias } },
          orderBy: { dataLimite: 'asc' },
          take: 3,
        }),
        prisma.mentoria.count({
          where: {
            estudanteId: req.user.id,
            status: { in: ['PENDENTE', 'CONFIRMADA', 'CONCLUIDA'] },
          },
        }),
      ])
      const areasDoPerfil = user?.area ? [user.area, ...(areasRelacionadas[user.area] || [])] : []
      const candidaturasExistentes = await prisma.candidatura.findMany({
        where: { userId: req.user.id },
        select: { bolsaId: true },
      })
      const idsCandidatados = new Set(candidaturasExistentes.map(({ bolsaId }) => bolsaId))
      const bolsasAbertas = await prisma.bolsa.findMany({
        where: { status: 'ABERTA', dataLimite: { gte: agora } },
        orderBy: { createdAt: 'desc' },
      })
      const elegiveis = bolsasAbertas.filter((bolsa) => !idsCandidatados.has(bolsa.id))
      const recomendadas = [
        ...elegiveis
          .filter((bolsa) => areasDoPerfil.includes(bolsa.area))
          .sort((a, b) => a.dataLimite - b.dataLimite)
          .map((bolsa) => ({ ...bolsa, recomendacao: null })),
        ...elegiveis
          .filter((bolsa) => !areasDoPerfil.includes(bolsa.area))
          .map((bolsa) => ({ ...bolsa, recomendacao: 'RECENTE' })),
      ].slice(0, 5)
      const selectMentor = {
        id: true,
        nome: true,
        area: true,
        biografia: true,
        biografiaEn: true,
        mentorDisponibilidades: {
          where: { ativa: true, inicio: { gte: agora } },
          include: {
            mentorias: {
              where: { status: { in: ['PENDENTE', 'CONFIRMADA'] } },
              select: { id: true },
            },
          },
        },
      }
      const mentoresDaArea = await prisma.user.findMany({
        where: {
          role: 'MENTOR',
          bloqueado: false,
          ...(areasDoPerfil.length ? { area: { in: areasDoPerfil } } : {}),
        },
        select: selectMentor,
      })
      const mentoresRestantes = areasDoPerfil.length
        ? await prisma.user.findMany({
            where: {
              role: 'MENTOR',
              bloqueado: false,
              OR: [{ area: { notIn: areasDoPerfil } }, { area: null }],
            },
            select: selectMentor,
          })
        : []
      const ordenarMentores = (lista) =>
        lista
          .map(({ mentorDisponibilidades, ...mentor }) => ({
            ...mentor,
            temHorarioLivre: mentorDisponibilidades.some((d) => d.mentorias.length === 0),
          }))
          .sort((a, b) => Number(b.temHorarioLivre) - Number(a.temHorarioLivre))
      const mentoresSugeridos = [
        ...ordenarMentores(mentoresDaArea),
        ...ordenarMentores(mentoresRestantes),
      ].slice(0, 5)
      const prazos = prazosDoMes.length ? prazosDoMes : prazosFuturos
      const completude = [
        user?.nome,
        user?.email,
        user?.area,
        user?.instituicao,
        user?.biografia,
        user?.telefone,
      ].filter(Boolean).length
      const [variacaoAtivas, variacaoAprovadas] = await Promise.all([
        variarCriados(prisma.candidatura, {
          userId: req.user.id,
          status: { in: ['PENDENTE', 'EM_ANALISE'] },
        }),
        variarCriados(prisma.candidatura, { userId: req.user.id, status: 'APROVADA' }),
      ])
      return res.json({
        ...basePublica,
        estudante: {
          candidaturasAtivas,
          candidaturasAprovadas,
          variacoes: {
            candidaturasAtivas: variacaoAtivas,
            candidaturasAprovadas: variacaoAprovadas,
          },
          sessaoSemana,
          proximaSessao,
          prazos,
          prazosFallback: !prazosDoMes.length,
          candidaturas,
          bolsasRecomendadas: recomendadas,
          mentoresSugeridos,
          area: user?.area || null,
          completudePerfil: Math.round((completude / 6) * 100),
          perfilCriadoEm: user?.createdAt,
          etapas: {
            perfil: completude === 6,
            candidatura: candidaturasAtivas + candidaturasAprovadas > 0,
            aprovacao: candidaturasAprovadas > 0,
            mentoria: mentoriasDoEstudante > 0,
          },
        },
      })
    }

    if (req.user.role === 'MENTOR') {
      const [
        pendentes,
        sessoesSemana,
        concluidasMes,
        concluidasOitoSemanas,
        avaliacoes,
        proximas,
        disponibilidades,
      ] = await Promise.all([
        prisma.mentoria.count({ where: { mentorId: req.user.id, status: 'PENDENTE' } }),
        prisma.mentoria.findMany({
          where: {
            mentorId: req.user.id,
            status: { in: ['PENDENTE', 'CONFIRMADA'] },
            disponibilidade: { inicio: { gte: inicioSemana, lt: fimSemana } },
          },
          include: { estudante: { select: { id: true, nome: true } }, disponibilidade: true },
          orderBy: { disponibilidade: { inicio: 'asc' } },
        }),
        prisma.mentoria.findMany({
          where: {
            mentorId: req.user.id,
            status: 'CONCLUIDA',
            updatedAt: { gte: iniciarMesUTC(agora), lte: agora },
          },
          include: { disponibilidade: true },
        }),
        prisma.mentoria.findMany({
          where: {
            mentorId: req.user.id,
            status: 'CONCLUIDA',
            disponibilidade: {
              inicio: { gte: new Date(inicioSemana.getTime() - 7 * 7 * DIA), lte: agora },
            },
          },
          include: { disponibilidade: true },
        }),
        prisma.mentoria.aggregate({
          where: { mentorId: req.user.id, avaliacao: { not: null } },
          _avg: { avaliacao: true },
          _count: { avaliacao: true },
        }),
        prisma.mentoria.findMany({
          where: {
            mentorId: req.user.id,
            status: { in: ['PENDENTE', 'CONFIRMADA'] },
            disponibilidade: { inicio: { gte: agora } },
          },
          include: { estudante: { select: { id: true, nome: true } }, disponibilidade: true },
          orderBy: { disponibilidade: { inicio: 'asc' } },
          take: 5,
        }),
        prisma.disponibilidadeMentor.findMany({
          where: { mentorId: req.user.id, ativa: true, inicio: { gte: agora } },
          include: {
            mentorias: {
              where: { status: { in: ['PENDENTE', 'CONFIRMADA'] } },
              select: { id: true },
            },
          },
        }),
      ])
      const agendaSemana = Array.from({ length: 7 }, (_, dia) => {
        const data = new Date(inicioSemana.getTime() + dia * DIA)
        return {
          data: data.toISOString(),
          sessoes: sessoesSemana.filter(
            (sessao) =>
              sessao.disponibilidade.inicio.toISOString().slice(0, 10) ===
              data.toISOString().slice(0, 10),
          ),
        }
      })
      const horasPorSemana = Array.from({ length: 8 }, (_, indice) => {
        const inicio = new Date(inicioSemana.getTime() + (indice - 7) * 7 * DIA)
        const fim = new Date(inicio.getTime() + 7 * DIA)
        const concluidas = concluidasOitoSemanas.filter(
          (sessao) =>
            sessao.disponibilidade.inicio >= inicio && sessao.disponibilidade.inicio < fim,
        )
        return { semana: inicio.toISOString(), horas: Math.round(somaHoras(concluidas) * 10) / 10 }
      })
      const taxaOcupacao = disponibilidades.length
        ? Math.round(
            (disponibilidades.filter((d) => d.mentorias.length).length / disponibilidades.length) *
              100,
          )
        : 0
      const variacaoPendentes = await variarCriados(prisma.mentoria, {
        mentorId: req.user.id,
        status: 'PENDENTE',
      })
      return res.json({
        ...basePublica,
        mentor: {
          pedidosPendentes: pendentes,
          sessoesSemana: sessoesSemana.length,
          agendaSemana,
          horasRealizadasMes: Math.round(somaHoras(concluidasMes) * 10) / 10,
          horasPorSemana,
          avaliacaoMedia: Number(avaliacoes._avg.avaliacao || 0),
          totalAvaliacoes: avaliacoes._count.avaliacao,
          proximas,
          ocupacaoHorarios: taxaOcupacao,
          totalHorariosPublicados: disponibilidades.length,
          variacoes: { pedidosPendentes: variacaoPendentes },
        },
      })
    }

    if (req.user.role === 'ADMIN') {
      const seisMeses = deslocarMes(iniciarMesUTC(agora), -5)
      const oitoSemanas = new Date(inicioSemana.getTime() - 7 * 7 * DIA)
      const [
        totalUtilizadores,
        bolsasAbertasAdmin,
        totalCandidaturas,
        totalMentorias,
        candidaturasMes,
        mentoriasRecentes,
        bolsasArea,
        topBolsas,
        candidaturasParadas,
        mentoresAtivos,
        bolsasPrazoMes,
        utilizadoresRecentes,
        bolsasRecentesAdmin,
        candidaturasRecentes,
        mentoriasRecentesAdmin,
        bolsasAtualizadas,
        candidaturasAtualizadas,
        mentoriasAtualizadas,
        variacoes,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.bolsa.count({ where: { status: 'ABERTA', dataLimite: { gte: agora } } }),
        prisma.candidatura.count(),
        prisma.mentoria.count(),
        prisma.candidatura.findMany({
          where: { createdAt: { gte: seisMeses } },
          select: { createdAt: true },
        }),
        prisma.mentoria.findMany({
          where: { createdAt: { gte: oitoSemanas } },
          select: { createdAt: true },
        }),
        prisma.bolsa.groupBy({ by: ['area'], _count: { area: true } }),
        prisma.bolsa.findMany({
          include: { _count: { select: { candidaturas: true } } },
          orderBy: { candidaturas: { _count: 'desc' } },
          take: 5,
        }),
        prisma.candidatura.findMany({
          where: { status: { in: ['PENDENTE', 'EM_ANALISE'] }, createdAt: { lt: seteDiasAtras } },
          include: {
            user: { select: { id: true, nome: true } },
            bolsa: { select: { id: true, titulo: true, tituloEn: true } },
          },
          orderBy: { createdAt: 'asc' },
          take: 10,
        }),
        prisma.user.findMany({
          where: { role: 'MENTOR', bloqueado: false },
          select: {
            id: true,
            nome: true,
            area: true,
            _count: { select: { mentoriasComoMentor: true } },
          },
        }),
        prisma.bolsa.findMany({
          where: { status: 'ABERTA', dataLimite: { gte: agora, lte: ha30Dias } },
          orderBy: { dataLimite: 'asc' },
          take: 5,
        }),
        prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, nome: true, role: true, createdAt: true },
        }),
        prisma.bolsa.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, titulo: true, tituloEn: true, createdAt: true },
        }),
        prisma.candidatura.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: { select: { nome: true } },
            bolsa: { select: { titulo: true, tituloEn: true } },
          },
        }),
        prisma.mentoria.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { mentor: { select: { nome: true } }, estudante: { select: { nome: true } } },
        }),
        prisma.bolsa.findMany({
          orderBy: { updatedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            titulo: true,
            tituloEn: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.candidatura.findMany({
          orderBy: { updatedAt: 'desc' },
          take: 10,
          include: {
            user: { select: { nome: true } },
            bolsa: { select: { titulo: true, tituloEn: true } },
          },
        }),
        prisma.mentoria.findMany({
          orderBy: { updatedAt: 'desc' },
          take: 10,
          include: { mentor: { select: { nome: true } }, estudante: { select: { nome: true } } },
        }),
        Promise.all([
          variarCriados(prisma.user),
          variarCriados(prisma.bolsa, { status: 'ABERTA', dataLimite: { gte: agora } }),
          variarCriados(prisma.candidatura),
          variarCriados(prisma.mentoria),
        ]),
      ])
      const bolsasPrazoFallback = bolsasPrazoMes.length
        ? []
        : await prisma.bolsa.findMany({
            where: { status: 'ABERTA', dataLimite: { gt: ha30Dias } },
            orderBy: { dataLimite: 'asc' },
            take: 3,
          })
      const bolsasPrazo = bolsasPrazoMes.length ? bolsasPrazoMes : bolsasPrazoFallback
      const serieMes = Array.from({ length: 6 }, (_, indice) => {
        const inicio = deslocarMes(iniciarMesUTC(agora), indice - 5)
        return {
          mes: inicio.toISOString(),
          total: candidaturasMes.filter(
            (item) => item.createdAt >= inicio && item.createdAt < deslocarMes(inicio, 1),
          ).length,
        }
      })
      const serieSemanas = Array.from({ length: 8 }, (_, indice) => {
        const inicio = new Date(inicioSemana.getTime() + (indice - 7) * 7 * DIA)
        const fim = new Date(inicio.getTime() + 7 * DIA)
        return {
          semana: inicio.toISOString(),
          total: mentoriasRecentes.filter(
            (item) => item.createdAt >= inicio && item.createdAt < fim,
          ).length,
        }
      })
      const recentes = [
        ...utilizadoresRecentes.map((item) => ({
          id: `user-${item.id}`,
          tipo: 'utilizador',
          nome: item.nome,
          role: item.role,
          data: item.createdAt.toISOString(),
        })),
        ...bolsasRecentesAdmin.map((item) => ({
          id: `bolsa-${item.id}`,
          tipo: 'bolsa',
          titulo: item.titulo,
          tituloEn: item.tituloEn,
          data: item.createdAt.toISOString(),
        })),
        ...candidaturasRecentes.map((item) => ({
          id: `candidatura-${item.id}`,
          tipo: 'candidatura',
          nome: item.user.nome,
          titulo: item.bolsa.titulo,
          tituloEn: item.bolsa.tituloEn,
          data: item.createdAt.toISOString(),
        })),
        ...mentoriasRecentesAdmin.map((item) => ({
          id: `mentoria-${item.id}`,
          tipo: 'mentoria',
          nome: item.estudante.nome,
          mentor: item.mentor.nome,
          data: item.createdAt.toISOString(),
        })),
        ...bolsasAtualizadas
          .filter((item) => item.updatedAt.getTime() - item.createdAt.getTime() > 1000)
          .map((item) => ({
            id: `bolsa-atualizada-${item.id}`,
            tipo: 'bolsaAtualizada',
            titulo: item.titulo,
            tituloEn: item.tituloEn,
            status: item.status,
            data: item.updatedAt.toISOString(),
          })),
        ...candidaturasAtualizadas
          .filter((item) => item.updatedAt.getTime() - item.createdAt.getTime() > 1000)
          .map((item) => ({
            id: `candidatura-atualizada-${item.id}`,
            tipo: 'candidaturaAtualizada',
            nome: item.user.nome,
            titulo: item.bolsa.titulo,
            tituloEn: item.bolsa.tituloEn,
            status: item.status,
            data: item.updatedAt.toISOString(),
          })),
        ...mentoriasAtualizadas
          .filter((item) => item.updatedAt.getTime() - item.createdAt.getTime() > 1000)
          .map((item) => ({
            id: `mentoria-atualizada-${item.id}`,
            tipo: 'mentoriaAtualizada',
            nome: item.estudante.nome,
            mentor: item.mentor.nome,
            status: item.status,
            data: item.updatedAt.toISOString(),
          })),
      ]
        .sort((a, b) => b.data.localeCompare(a.data))
        .slice(0, 10)
      const mentoriasConcluidasIds = await prisma.mentoria.groupBy({
        by: ['mentorId'],
        where: { status: 'CONCLUIDA' },
        _count: { mentorId: true },
      })
      const concluidasPorMentor = new Map(
        mentoriasConcluidasIds.map((item) => [item.mentorId, item._count.mentorId]),
      )
      return res.json({
        ...basePublica,
        admin: {
          totais: {
            utilizadores: totalUtilizadores,
            bolsasAbertas: bolsasAbertasAdmin,
            candidaturas: totalCandidaturas,
            mentorias: totalMentorias,
          },
          variacoes: {
            utilizadores: variacoes[0],
            bolsas: variacoes[1],
            candidaturas: variacoes[2],
            mentorias: variacoes[3],
          },
          candidaturasPorMes: serieMes,
          mentoriasPorSemana: serieSemanas,
          bolsasPorArea: bolsasArea.map((item) => ({ area: item.area, total: item._count.area })),
          topBolsas: topBolsas.map(({ _count, ...bolsa }) => ({
            ...bolsa,
            candidaturas: _count.candidaturas,
          })),
          candidaturasParadas,
          mentoresAtivos: mentoresAtivos
            .map((mentor) => ({
              id: mentor.id,
              nome: mentor.nome,
              area: mentor.area,
              sessoesConcluidas: concluidasPorMentor.get(mentor.id) || 0,
            }))
            .sort((a, b) => b.sessoesConcluidas - a.sessoesConcluidas)
            .slice(0, 5),
          bolsasPrazo,
          prazosFallback: !bolsasPrazoMes.length,
          atividadeRecente: recentes,
        },
      })
    }

    res.json(basePublica)
  } catch (err) {
    next(err)
  }
}

export const estatisticas = async (req, res, next) => {
  try {
    const [bolsasAbertas, totalMentores, mentoriasAgendadas, candidaturas] = await Promise.all([
      prisma.bolsa.count({ where: { status: 'ABERTA' } }),
      prisma.user.count({ where: { role: 'MENTOR' } }),
      prisma.mentoria.count({ where: { status: { in: ['PENDENTE', 'CONFIRMADA'] } } }),
      prisma.candidatura.groupBy({ by: ['status'], _count: { status: true } }),
    ])

    const bolsasPorArea = await prisma.bolsa.groupBy({ by: ['area'], _count: { area: true } })
    const mentorias = await prisma.mentoria.findMany({ select: { createdAt: true } })
    const mentoriasPorMes = {}
    mentorias.forEach((m) => {
      const key = `${m.createdAt.getFullYear()}-${String(m.createdAt.getMonth() + 1).padStart(2, '0')}`
      mentoriasPorMes[key] = (mentoriasPorMes[key] || 0) + 1
    })

    res.json({
      bolsasAbertas,
      totalMentores,
      mentoriasAgendadas,
      candidaturasPorEstado: candidaturas,
      bolsasPorArea,
      mentoriasPorMes: Object.entries(mentoriasPorMes).map(([mes, total]) => ({ mes, total })),
    })
  } catch (err) {
    next(err)
  }
}

export const minhaArea = async (req, res, next) => {
  try {
    const [candidaturas, mentorias] = await Promise.all([
      prisma.candidatura.findMany({
        where: { userId: req.user.id },
        include: { bolsa: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.mentoria.findMany({
        where:
          req.user.role === 'MENTOR' ? { mentorId: req.user.id } : { estudanteId: req.user.id },
        include: {
          mentor: { select: { nome: true } },
          estudante: { select: { nome: true } },
          disponibilidade: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])
    res.json({ candidaturas, mentorias })
  } catch (err) {
    next(err)
  }
}
