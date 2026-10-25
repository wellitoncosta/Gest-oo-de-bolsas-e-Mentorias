import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function disponibilidadeEmDias(dias, horaInicio, horaFim) {
  const agora = new Date()
  const partes = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Luanda', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(agora).map(({ type, value }) => [type, value]))
  const dataAlvo = new Date(Date.UTC(Number(partes.year), Number(partes.month) - 1, Number(partes.day) + dias))
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
    data: { nome: 'Administrador Demo', email: 'admin@demo.com', senha: senhaAdmin, role: 'ADMIN' }
  })

  const mentor1 = await prisma.user.create({
    data: { nome: 'Ana Silva', email: 'ana.mentor@demo.com', senha, role: 'MENTOR', area: 'Engenharia Informática', biografia: 'Especialista em IA e Desenvolvimento Web.' }
  })
  const mentor2 = await prisma.user.create({
    data: { nome: 'Carlos Mendes', email: 'carlos.mentor@demo.com', senha, role: 'MENTOR', area: 'Gestão e Empreendedorismo', biografia: 'Consultor com 10 anos de experiência.' }
  })

  const est1 = await prisma.user.create({
    data: { nome: 'João Pereira', email: 'joao.estudante@demo.com', senha, role: 'ESTUDANTE', area: 'Engenharia Informática' }
  })
  const est2 = await prisma.user.create({
    data: { nome: 'Maria Santos', email: 'maria.estudante@demo.com', senha, role: 'ESTUDANTE', area: 'Gestão' }
  })

  const bolsas = [
    { titulo: 'Bolsa de Mérito Académico 2026', descricao: 'Apoio financeiro a estudantes com excelente desempenho académico.', entidade: 'Fundação Universitária', valor: '€500/mês', requisitos: 'Média >= 16 valores', area: 'Geral', dataLimite: new Date(Date.now()+30*86400000) },
    { titulo: 'Bolsa Investigação IA', descricao: 'Bolsa para projetos de investigação em Inteligência Artificial.', entidade: 'Laboratório IA', valor: '€800/mês', requisitos: 'Conhecimentos em Python e ML', area: 'Engenharia Informática', dataLimite: new Date(Date.now()+25*86400000) },
    { titulo: 'Bolsa Empreendedorismo Júnior', descricao: 'Apoio a estudantes com ideias inovadoras de negócio.', entidade: 'Incubadora XYZ', valor: '€600/mês', requisitos: 'Plano de negócio apresentado', area: 'Gestão', dataLimite: new Date(Date.now()+40*86400000) },
    { titulo: 'Bolsa Mobilidade Internacional', descricao: 'Apoio para semestre de estudos no estrangeiro.', entidade: 'Programa Erasmus+', valor: '€700/mês', requisitos: 'Candidatura aprovada pela instituição', area: 'Geral', dataLimite: new Date(Date.now()+20*86400000) },
    { titulo: 'Bolsa Desenvolvimento Sustentável', descricao: 'Projetos com impacto ambiental e social.', entidade: 'Fundação Verde', valor: '€650/mês', requisitos: 'Proposta com objetivos sustentáveis', area: 'Ambiente', dataLimite: new Date(Date.now()+35*86400000) },
    { titulo: 'Bolsa Dados e Cibersegurança', descricao: 'Foco em segurança informática e análise de dados.', entidade: 'Tech4Future', valor: '€750/mês', requisitos: 'Conhecimentos básicos de redes', area: 'Engenharia Informática', dataLimite: new Date(Date.now()+28*86400000) },
    { titulo: 'Bolsa Voluntariado e Liderança', descricao: 'Valoriza o voluntariado e competências de liderança.', entidade: 'Associação Solidária', valor: '€400/mês', requisitos: 'Experiência em voluntariado', area: 'Sociais', dataLimite: new Date(Date.now()+22*86400000) },
    { titulo: 'Bolsa Inovação e StartUp', descricao: 'Apoio a projetos tecnológicos com potencial comercial.', entidade: 'StartupHub', valor: '€900/mês', requisitos: 'Protótipo funcional', area: 'Engenharia Informática', dataLimite: new Date(Date.now()+32*86400000) },
  ]

  for (const b of bolsas) {
    await prisma.bolsa.create({ data: b })
  }

  // Disponibilidades
  await prisma.disponibilidadeMentor.create({ data: { mentorId: mentor1.id, ...disponibilidadeEmDias(2, '14:00', '15:00') } })
  await prisma.disponibilidadeMentor.create({ data: { mentorId: mentor1.id, ...disponibilidadeEmDias(6, '10:00', '11:00') } })
  await prisma.disponibilidadeMentor.create({ data: { mentorId: mentor2.id, ...disponibilidadeEmDias(10, '16:00', '17:00') } })

  console.log('Seed concluído!')
  console.log('Admin: admin@demo.com / Admin123!')
  console.log('Mentor: ana.mentor@demo.com / Pass123!')
  console.log('Estudante: joao.estudante@demo.com / Pass123!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
