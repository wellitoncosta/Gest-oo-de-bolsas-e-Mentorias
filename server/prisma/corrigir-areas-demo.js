import prisma from '../src/config/db.js'

const titulos = [
  'Bolsa Investigação IA',
  'Bolsa Dados e Cibersegurança',
  'Bolsa Inovação e StartUp',
]

try {
  const bolsas = await prisma.bolsa.updateMany({
    where: { titulo: { in: titulos } },
    data: { area: 'tecnologia' },
  })
  const mentores = await prisma.user.updateMany({
    where: { email: 'ana.mentor@demo.com', role: 'MENTOR' },
    data: { area: 'tecnologia' },
  })
  console.log(
    `Áreas de demonstração normalizadas: ${bolsas.count} bolsa(s), ${mentores.count} mentor(es).`,
  )
} finally {
  await prisma.$disconnect()
}
