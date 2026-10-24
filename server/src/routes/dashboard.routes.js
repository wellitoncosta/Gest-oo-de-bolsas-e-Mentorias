import { Router } from 'express'
import { estatisticas, minhaArea } from '../controllers/dashboard.controller.js'
import { autenticar } from '../middlewares/auth.js'

const router = Router()
router.get('/estatisticas', estatisticas)
router.get('/minha-area', autenticar, minhaArea)

export default router
