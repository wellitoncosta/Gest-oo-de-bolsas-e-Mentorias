import { Router } from 'express'
import { listar, obter, criar, atualizar, remover } from '../controllers/bolsas.controller.js'
import { autenticar, autorizar } from '../middlewares/auth.js'

const router = Router()
router.get('/', listar)
router.get('/:id', obter)
router.post('/', autenticar, autorizar('ADMIN'), criar)
router.put('/:id', autenticar, autorizar('ADMIN'), atualizar)
router.delete('/:id', autenticar, autorizar('ADMIN'), remover)

export default router
