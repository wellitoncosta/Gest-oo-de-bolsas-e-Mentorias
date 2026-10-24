import { Router } from 'express'
import { listar, alterarBloqueio } from '../controllers/utilizadores.controller.js'
import { autenticar, autorizar } from '../middlewares/auth.js'

const router = Router()
router.get('/', autenticar, autorizar('ADMIN'), listar)
router.put('/:id/bloqueio', autenticar, autorizar('ADMIN'), alterarBloqueio)

export default router
