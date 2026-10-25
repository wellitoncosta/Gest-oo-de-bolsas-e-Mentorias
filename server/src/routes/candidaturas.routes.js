import { Router } from 'express'
import {
  candidatar,
  minhasCandidaturas,
  listarTodas,
  atualizarEstado,
  cancelar,
} from '../controllers/candidaturas.controller.js'
import { autenticar, autorizar } from '../middlewares/auth.js'

const router = Router()
router.post('/bolsa/:bolsaId', autenticar, autorizar('ESTUDANTE'), candidatar)
router.get('/minhas', autenticar, autorizar('ESTUDANTE'), minhasCandidaturas)
router.get('/', autenticar, autorizar('ADMIN'), listarTodas)
router.put('/:id/estado', autenticar, autorizar('ADMIN'), atualizarEstado)
router.delete('/:id', autenticar, autorizar('ESTUDANTE'), cancelar)

export default router
