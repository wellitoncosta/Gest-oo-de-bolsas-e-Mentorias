import prisma from '../config/db.js'

export const listar = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nome: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (err) { next(err) }
}

export const remover = async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ mensagem: 'Utilizador removido' })
  } catch (err) { next(err) }
}
