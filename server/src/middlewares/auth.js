import { verificarToken } from '../utils/jwt.js'
import prisma from '../config/db.js'

export const autenticar = async (req, res, next) => {
  try {
    let token = null
    if (req.cookies?.token) token = req.cookies.token
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }
    if (!token) return res.status(401).json({ mensagem: 'Não autenticado' })

    const decoded = verificarToken(token)
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true, nome: true, email: true, role: true } })
    if (!user) return res.status(401).json({ mensagem: 'Utilizador não encontrado' })
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado' })
  }
}

export const autorizar = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ mensagem: 'Não autenticado' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ mensagem: 'Sem permissão para aceder a este recurso' })
    next()
  }
}
