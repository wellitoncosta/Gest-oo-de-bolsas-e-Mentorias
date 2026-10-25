import prisma from '../config/db.js'
import { verificarToken } from '../utils/jwt.js'
import { emitirPara, registarCliente } from '../realtime/hub.js'

export const ligarEventos = async (req, res) => {
  let utilizador = null
  const token = req.cookies?.token
  if (token) {
    try {
      const decoded = verificarToken(token)
      utilizador = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true, bloqueado: true },
      })
    } catch {
      // O SSE também aceita visitantes sem sessão válida.
    }
  }

  res.status(200)
  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()
  res.write('retry: 3000\n\n')

  registarCliente({
    userId: utilizador?.id,
    role: utilizador?.role,
    res,
  })
  if (utilizador?.bloqueado) emitirPara(utilizador.id, 'conta:bloqueada', { userId: utilizador.id })
}
