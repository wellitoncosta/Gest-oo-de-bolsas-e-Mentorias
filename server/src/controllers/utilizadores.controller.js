import prisma from '../config/db.js'
import { emitirPara } from '../realtime/hub.js'

export const listar = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nome: true, email: true, role: true, bloqueado: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(users)
  } catch (err) {
    next(err)
  }
}

export const alterarBloqueio = async (req, res, next) => {
  try {
    const { bloqueado } = req.body
    if (req.params.id === req.user.id) {
      return res
        .status(400)
        .json({ mensagem: 'Não pode bloquear a própria conta', codigo: 'BLOQUEIO_PROPRIA_CONTA' })
    }
    const alvo = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!alvo)
      return res
        .status(404)
        .json({ mensagem: 'Utilizador não encontrado', codigo: 'UTILIZADOR_NAO_ENCONTRADO' })
    if (alvo.role === 'ADMIN') {
      return res.status(403).json({
        mensagem: 'Não é possível bloquear outro administrador',
        codigo: 'BLOQUEIO_ADMIN_NAO_PERMITIDO',
      })
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { bloqueado: !!bloqueado },
      select: { id: true, nome: true, email: true, role: true, bloqueado: true },
    })
    if (user.bloqueado) emitirPara(user.id, 'conta:bloqueada', { userId: user.id })
    res.json(user)
  } catch (err) {
    next(err)
  }
}
