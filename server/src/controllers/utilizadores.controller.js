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
    if (req.params.id === req.user.id) {
      return res.status(400).json({ mensagem: 'Não pode apagar a própria conta' })
    }
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } })
    const alvo = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (alvo?.role === 'ADMIN' && admins <= 1) {
      return res.status(400).json({ mensagem: 'Não é possível remover o último administrador' })
    }
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ mensagem: 'Utilizador removido' })
  } catch (err) { next(err) }
}
