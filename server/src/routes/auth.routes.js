import { Router } from 'express'
import {
  registar,
  login,
  logout,
  me,
  pedirRecuperacao,
  validarCodigo,
  redefinirSenha,
  instituicoes,
} from '../controllers/auth.controller.js'
import { autenticar } from '../middlewares/auth.js'
import rateLimit from 'express-rate-limit'

const router = Router()
const dev = process.env.NODE_ENV !== 'production'
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: dev ? 1000 : 20,
  message: {
    mensagem: 'Muitas tentativas. Tente novamente mais tarde.',
    codigo: 'MUITAS_TENTATIVAS',
  },
})
const limiterPedir = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: dev ? 10000 : 5,
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toLowerCase()
    return req.ip + ':' + email
  },
  message: {
    mensagem: 'Muitas tentativas. Tente novamente mais tarde.',
    codigo: 'MUITAS_TENTATIVAS',
  },
})
const limiterValidar = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: dev ? 10000 : 15,
  message: {
    mensagem: 'Muitas tentativas. Tente novamente mais tarde.',
    codigo: 'MUITAS_TENTATIVAS',
  },
})
const limiterRedefinir = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: dev ? 10000 : 15,
  message: {
    mensagem: 'Muitas tentativas. Tente novamente mais tarde.',
    codigo: 'MUITAS_TENTATIVAS',
  },
})

router.post('/registar', limiter, registar)
router.get('/instituicoes', instituicoes)
router.post('/login', limiter, login)
router.post('/logout', logout)
router.get('/me', autenticar, me)
router.post('/recuperacao/pedir', limiterPedir, pedirRecuperacao)
router.post('/recuperacao/validar-codigo', limiterValidar, validarCodigo)
router.post('/recuperacao/redefinir', limiterRedefinir, redefinirSenha)

export default router
