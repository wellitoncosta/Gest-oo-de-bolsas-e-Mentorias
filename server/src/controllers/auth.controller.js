import * as authService from '../services/auth.service.js'
import { z } from 'zod'

const registarSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  email: z.string().trim().toLowerCase().email('Email inválido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['ESTUDANTE', 'MENTOR']).optional()
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  senha: z.string().min(1, 'Senha obrigatória')
})

const pedirSchema = z.object({ email: z.string().trim().toLowerCase().email('Email inválido') })
const validarCodigoSchema = z.object({ email: z.string().trim().toLowerCase().email('Email inválido'), codigo: z.string().trim().regex(/^\d{6}$/, 'O código deve ter 6 dígitos') })
const redefinirSchema = z.object({ email: z.string().trim().toLowerCase().email('Email inválido'), resetToken: z.string().min(1, 'Token inválido'), novaSenha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres') })

const setCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
}

export const registar = async (req, res, next) => {
  try {
    const dados = registarSchema.parse(req.body)
    const { user, token } = await authService.registar(dados)
    setCookie(res, token)
    res.status(201).json({ user, token })
  } catch (err) { next(err) }
}

export const login = async (req, res, next) => {
  try {
    const { email, senha } = loginSchema.parse(req.body)
    const { user, token } = await authService.login(email, senha)
    setCookie(res, token)
    res.json({ user, token })
  } catch (err) { next(err) }
}

export const logout = async (req, res) => {
  res.clearCookie('token')
  res.json({ mensagem: 'Sessão terminada' })
}

export const me = async (req, res) => {
  res.json({ user: req.user })
}

export const pedirRecuperacao = async (req, res, next) => {
  try {
    const { email } = pedirSchema.parse(req.body)
    const r = await authService.pedirRecuperacao(email)
    res.status(200).json(r)
  } catch (err) { next(err) }
}

export const validarCodigo = async (req, res, next) => {
  try {
    const { email, codigo } = validarCodigoSchema.parse(req.body)
    const r = await authService.validarCodigo(email, codigo)
    res.status(200).json(r)
  } catch (err) { next(err) }
}

export const redefinirSenha = async (req, res, next) => {
  try {
    const { email, resetToken, novaSenha } = redefinirSchema.parse(req.body)
    const r = await authService.redefinirSenha(email, resetToken, novaSenha)
    res.status(200).json(r)
  } catch (err) { next(err) }
}
