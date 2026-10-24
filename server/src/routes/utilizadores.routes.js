import { Router } from 'express'
import { listar, remover } from '../controllers/utilizadores.controller.js'
import { autenticar, autorizar } from '../middlewares/auth.js'

const router = Router()
router.get('/', autenticar, autorizar('ADMIN'), listar)
router.delete('/:id', autenticar, autorizar('ADMIN'), remover)

export default router
