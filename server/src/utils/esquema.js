import prisma from '../config/db.js'

let colunaAtivaDisponibilidade

export async function disponibilidadeTemColunaAtiva() {
  if (colunaAtivaDisponibilidade !== undefined) return colunaAtivaDisponibilidade
  const colunas = await prisma.$queryRawUnsafe('PRAGMA table_info("DisponibilidadeMentor")')
  colunaAtivaDisponibilidade = colunas.some((coluna) => coluna.name === 'ativa')
  return colunaAtivaDisponibilidade
}
