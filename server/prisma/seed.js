import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function disponibilidadeEmDias(dias, horaInicio, horaFim) {
  const agora = new Date()
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Luanda',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(agora)
      .map(({ type, value }) => [type, value]),
  )
  const dataAlvo = new Date(
    Date.UTC(Number(partes.year), Number(partes.month) - 1, Number(partes.day) + dias),
  )
  const data = `${dataAlvo.getUTCFullYear()}-${String(dataAlvo.getUTCMonth() + 1).padStart(2, '0')}-${String(dataAlvo.getUTCDate()).padStart(2, '0')}`
  const inicio = new Date(`${data}T${horaInicio}:00+01:00`)
  const fim = new Date(`${data}T${horaFim}:00+01:00`)
  return { data: new Date(`${data}T00:00:00.000Z`), horaInicio, horaFim, inicio, fim }
}

async function main() {
  // Limpar
  await prisma.mentoria.deleteMany()
  await prisma.disponibilidadeMentor.deleteMany()
  await prisma.candidatura.deleteMany()
  await prisma.bolsa.deleteMany()
  await prisma.passwordReset.deleteMany()
  await prisma.user.deleteMany()

  const senhaAdmin = await bcrypt.hash('Admin123!', 10)
  const senha = await bcrypt.hash('Pass123!', 10)

  const admin = await prisma.user.create({
    data: { nome: 'Administrador Demo', email: 'admin@demo.com', senha: senhaAdmin, role: 'ADMIN' },
  })

  const mentor1 = await prisma.user.create({
    data: {
      nome: 'Ana Silva',
      email: 'ana.mentor@demo.com',
      senha,
      role: 'MENTOR',
      area: 'tecnologia',
      biografia: 'Especialista em IA e Desenvolvimento Web.',
      biografiaEn: 'AI and web development specialist.',
    },
  })
  const mentor2 = await prisma.user.create({
    data: {
      nome: 'Carlos Mendes',
      email: 'carlos.mentor@demo.com',
      senha,
      role: 'MENTOR',
      area: 'gestao',
      biografia: 'Consultor com 10 anos de experiência.',
      biografiaEn: 'Consultant with 10 years of experience.',
    },
  })

  const est1 = await prisma.user.create({
    data: {
      nome: 'João Pereira',
      email: 'joao.estudante@demo.com',
      senha,
      role: 'ESTUDANTE',
      area: 'tecnologia',
    },
  })
  const est2 = await prisma.user.create({
    data: {
      nome: 'Maria Santos',
      email: 'maria.estudante@demo.com',
      senha,
      role: 'ESTUDANTE',
      area: 'gestao',
    },
  })

  const bolsas = [
    {
      titulo: 'Bolsa de Mérito Académico 2026',
      tituloEn: '2026 Academic Merit Scholarship',
      descricao: 'Apoio financeiro a estudantes com excelente desempenho académico.',
      descricaoEn: 'Financial support for students with excellent academic performance.',
      entidade: 'Fundação Universitária',
      valor: '€500/mês',
      valorEn: '€500/month',
      requisitos: 'Média >= 16 valores',
      requisitosEn: 'Minimum average grade of 16/20',
      area: 'outra',
      dataLimite: new Date(Date.now() + 30 * 86400000),
    },
    {
      titulo: 'Bolsa Investigação IA',
      tituloEn: 'AI Research Scholarship',
      descricao: 'Bolsa para projetos de investigação em Inteligência Artificial.',
      descricaoEn: 'Scholarship for artificial intelligence research projects.',
      entidade: 'Laboratório IA',
      valor: '€800/mês',
      valorEn: '€800/month',
      requisitos: 'Conhecimentos em Python e ML',
      requisitosEn: 'Knowledge of Python and machine learning',
      area: 'tecnologia',
      dataLimite: new Date(Date.now() + 25 * 86400000),
    },
    {
      titulo: 'Bolsa Empreendedorismo Júnior',
      tituloEn: 'Junior Entrepreneurship Scholarship',
      descricao: 'Apoio a estudantes com ideias inovadoras de negócio.',
      descricaoEn: 'Support for students with innovative business ideas.',
      entidade: 'Incubadora XYZ',
      valor: '€600/mês',
      valorEn: '€600/month',
      requisitos: 'Plano de negócio apresentado',
      requisitosEn: 'Business plan submitted',
      area: 'gestao',
      dataLimite: new Date(Date.now() + 40 * 86400000),
    },
    {
      titulo: 'Bolsa Mobilidade Internacional',
      tituloEn: 'International Mobility Scholarship',
      descricao: 'Apoio para semestre de estudos no estrangeiro.',
      descricaoEn: 'Support for a semester of study abroad.',
      entidade: 'Programa Erasmus+',
      valor: '€700/mês',
      valorEn: '€700/month',
      requisitos: 'Candidatura aprovada pela instituição',
      requisitosEn: 'Application approved by the institution',
      area: 'outra',
      dataLimite: new Date(Date.now() + 20 * 86400000),
    },
    {
      titulo: 'Bolsa Desenvolvimento Sustentável',
      tituloEn: 'Sustainable Development Scholarship',
      descricao: 'Projetos com impacto ambiental e social.',
      descricaoEn: 'Projects with environmental and social impact.',
      entidade: 'Fundação Verde',
      valor: '€650/mês',
      valorEn: '€650/month',
      requisitos: 'Proposta com objetivos sustentáveis',
      requisitosEn: 'Proposal with sustainability goals',
      area: 'ciencias',
      dataLimite: new Date(Date.now() + 35 * 86400000),
    },
    {
      titulo: 'Bolsa Dados e Cibersegurança',
      tituloEn: 'Data and Cybersecurity Scholarship',
      descricao: 'Foco em segurança informática e análise de dados.',
      descricaoEn: 'Focus on cybersecurity and data analysis.',
      entidade: 'Tech4Future',
      valor: '€750/mês',
      valorEn: '€750/month',
      requisitos: 'Conhecimentos básicos de redes',
      requisitosEn: 'Basic knowledge of computer networks',
      area: 'tecnologia',
      dataLimite: new Date(Date.now() + 28 * 86400000),
    },
    {
      titulo: 'Bolsa Voluntariado e Liderança',
      tituloEn: 'Volunteering and Leadership Scholarship',
      descricao: 'Valoriza o voluntariado e competências de liderança.',
      descricaoEn: 'Recognises volunteering and leadership skills.',
      entidade: 'Associação Solidária',
      valor: '€400/mês',
      valorEn: '€400/month',
      requisitos: 'Experiência em voluntariado',
      requisitosEn: 'Volunteering experience',
      area: 'outra',
      dataLimite: new Date(Date.now() + 22 * 86400000),
    },
    {
      titulo: 'Bolsa Inovação e StartUp',
      tituloEn: 'Innovation and Startup Scholarship',
      descricao: 'Apoio a projetos tecnológicos com potencial comercial.',
      descricaoEn: 'Support for technology projects with commercial potential.',
      entidade: 'StartupHub',
      valor: '€900/mês',
      valorEn: '€900/month',
      requisitos: 'Protótipo funcional',
      requisitosEn: 'Working prototype',
      area: 'tecnologia',
      dataLimite: new Date(Date.now() + 32 * 86400000),
    },
  ]

  for (const b of bolsas) {
    await prisma.bolsa.create({ data: b })
  }

  // Disponibilidades
  await prisma.disponibilidadeMentor.create({
    data: { mentorId: mentor1.id, ...disponibilidadeEmDias(2, '14:00', '15:00') },
  })
  await prisma.disponibilidadeMentor.create({
    data: { mentorId: mentor1.id, ...disponibilidadeEmDias(6, '10:00', '11:00') },
  })
  await prisma.disponibilidadeMentor.create({
    data: { mentorId: mentor2.id, ...disponibilidadeEmDias(10, '16:00', '17:00') },
  })

  console.log('Seed concluído!')
  console.log('Admin: admin@demo.com / Admin123!')
  console.log('Mentor: ana.mentor@demo.com / Pass123!')
  console.log('Estudante: joao.estudante@demo.com / Pass123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
