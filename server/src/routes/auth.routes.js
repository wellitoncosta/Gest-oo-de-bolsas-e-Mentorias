import { Router } from 'express'
import { registar, login, logout, me, pedirRecuperacao, verificarRecuperacao } from '../controllers/auth.controller.js'
import { autenticar } from '../middlewares/auth.js'
import rateLimit from 'express-rate-limit'

const router = Router()
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { mensagem: 'Muitas tentativas. Tente novamente mais tarde.' } })
const limiterReset = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { mensagem: 'Muitas tentativas. Tente novamente mais tarde.' } })

router.post('/registar', limiter, registar)
router.post('/login', limiter, login)
router.post('/logout', logout)
router.get('/me', autenticar, me)
router.post('/recuperacao/pedir', limiterReset, pedirRecuperacao)
router.post('/recuperacao/verificar', limiterReset, verificarRecuperacao)

export default router
