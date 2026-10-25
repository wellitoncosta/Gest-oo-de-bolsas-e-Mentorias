import { verificarToken } from '../utils/jwt.js'
import prisma from '../config/db.js'

export const autenticar = async (req, res, next) => {
  try {
    let token = null
    if (req.cookies?.token) token = req.cookies.token
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }
    if (!token) return res.status(401).json({ mensagem: 'Não autenticado', codigo: 'NAO_AUTENTICADO' })

    const decoded = verificarToken(token)
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true, nome: true, email: true, role: true, bloqueado: true, fusoHorario: true } })
    if (!user) return res.status(401).json({ mensagem: 'Utilizador não encontrado', codigo: 'UTILIZADOR_NAO_ENCONTRADO' })
    if (user.bloqueado) return res.status(403).json({ mensagem: 'A sua conta foi bloqueada. Contacte o administrador.', codigo: 'CONTA_BLOQUEADA' })
    req.user = { id: user.id, nome: user.nome, email: user.email, role: user.role, fusoHorario: user.fusoHorario }
    next()
  } catch (err) {
    return res.status(401).json({ mensagem: 'Token inválido ou expirado', codigo: 'TOKEN_INVALIDO' })
  }
}

export const autorizar = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ mensagem: 'Não autenticado', codigo: 'NAO_AUTENTICADO' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ mensagem: 'Sem permissão para aceder a este recurso', codigo: 'SEM_PERMISSAO' })
    next()
  }
}
