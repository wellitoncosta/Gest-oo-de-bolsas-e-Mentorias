import { Router } from 'express'
import { estatisticas, minhaArea, resumo } from '../controllers/dashboard.controller.js'
import { autenticar, autenticarOpcional } from '../middlewares/auth.js'

const router = Router()
router.get('/estatisticas', estatisticas)
router.get('/resumo', autenticarOpcional, resumo)
router.get('/minha-area', autenticar, minhaArea)

export default router
