import { Router } from 'express'
import {
  verPerfil,
  editarPerfil,
  alterarSenha,
  apagarConta,
  resumoConta,
} from '../controllers/conta.controller.js'
import { autenticar } from '../middlewares/auth.js'

const router = Router()
router.get('/resumo', autenticar, resumoConta)
router.get('/', autenticar, verPerfil)
router.put('/', autenticar, editarPerfil)
router.put('/senha', autenticar, alterarSenha)
router.delete('/', autenticar, apagarConta)

export default router
