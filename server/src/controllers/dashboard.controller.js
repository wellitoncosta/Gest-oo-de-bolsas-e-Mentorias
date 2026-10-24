import prisma from '../config/db.js'

export const estatisticas = async (req, res, next) => {
  try {
    const [bolsasAbertas, totalMentores, mentoriasAgendadas, candidaturas] = await Promise.all([
      prisma.bolsa.count({ where: { status: 'ABERTA' } }),
      prisma.user.count({ where: { role: 'MENTOR' } }),
      prisma.mentoria.count({ where: { status: { in: ['PENDENTE', 'CONFIRMADA'] } } }),
      prisma.candidatura.groupBy({ by: ['status'], _count: { status: true } })
    ])

    const bolsasPorArea = await prisma.bolsa.groupBy({ by: ['area'], _count: { area: true } })
    const mentorias = await prisma.mentoria.findMany({ select: { createdAt: true } })
    const mentoriasPorMes = {}
    mentorias.forEach(m => {
      const key = `${m.createdAt.getFullYear()}-${String(m.createdAt.getMonth()+1).padStart(2,'0')}`
      mentoriasPorMes[key] = (mentoriasPorMes[key] || 0) + 1
    })

    res.json({
      bolsasAbertas,
      totalMentores,
      mentoriasAgendadas,
      candidaturasPorEstado: candidaturas,
      bolsasPorArea,
      mentoriasPorMes: Object.entries(mentoriasPorMes).map(([mes, total]) => ({ mes, total }))
    })
  } catch (err) { next(err) }
}

export const minhaArea = async (req, res, next) => {
  try {
    const [candidaturas, mentorias] = await Promise.all([
      prisma.candidatura.findMany({ where: { userId: req.user.id }, include: { bolsa: true }, orderBy: { createdAt: 'desc' } }),
      prisma.mentoria.findMany({ 
        where: req.user.role === 'MENTOR' ? { mentorId: req.user.id } : { estudanteId: req.user.id },
        include: { mentor: { select: { nome: true } }, estudante: { select: { nome: true } }, disponibilidade: true },
        orderBy: { createdAt: 'desc' }
      })
    ])
    res.json({ candidaturas, mentorias })
  } catch (err) { next(err) }
}
