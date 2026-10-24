import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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
  const hoje = new Date()
  const amanha = new Date(hoje); amanha.setDate(hoje.getDate()+1)
  const depois = new Date(hoje); depois.setDate(hoje.getDate()+2)
  await prisma.disponibilidadeMentor.create({ data: { mentorId: mentor1.id, data: amanha, horaInicio: '14:00', horaFim: '15:00' } })
  await prisma.disponibilidadeMentor.create({ data: { mentorId: mentor1.id, data: depois, horaInicio: '10:00', horaFim: '11:00' } })
  await prisma.disponibilidadeMentor.create({ data: { mentorId: mentor2.id, data: amanha, horaInicio: '16:00', horaFim: '17:00' } })

  console.log('Seed concluído!')
  console.log('Admin: admin@demo.com / Admin123!')
  console.log('Mentor: ana.mentor@demo.com / Pass123!')
  console.log('Estudante: joao.estudante@demo.com / Pass123!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
