import { Router } from 'express'
import {
  criarDisponibilidade,
  listarDisponibilidades,
  listarMentores,
  obterMentor,
  agendar,
  minhasMentorias,
  atualizarEstadoMentoria,
  avaliarMentoria,
  listarTodasMentorias,
  removerDisponibilidade,
  minhasDisponibilidades,
} from '../controllers/mentorias.controller.js'
import { autenticar, autorizar } from '../middlewares/auth.js'

const router = Router()
router.get('/mentores', listarMentores)
router.get('/mentores/:id', obterMentor)
router.get('/disponibilidades', listarDisponibilidades)
router.get('/minhas-disponibilidades', autenticar, autorizar('MENTOR'), minhasDisponibilidades)
router.post('/disponibilidades', autenticar, autorizar('MENTOR'), criarDisponibilidade)
router.delete('/disponibilidades/:id', autenticar, autorizar('MENTOR'), removerDisponibilidade)
router.post('/agendar', autenticar, autorizar('ESTUDANTE'), agendar)
router.get('/minhas', autenticar, minhasMentorias)
router.put('/:id/estado', autenticar, atualizarEstadoMentoria)
router.put('/:id/avaliacao', autenticar, autorizar('ESTUDANTE'), avaliarMentoria)
router.get('/', autenticar, autorizar('ADMIN'), listarTodasMentorias)

export default router
