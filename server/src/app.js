import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.routes.js'
import bolsasRoutes from './routes/bolsas.routes.js'
import candidaturasRoutes from './routes/candidaturas.routes.js'
import mentoriasRoutes from './routes/mentorias.routes.js'
import contaRoutes from './routes/conta.routes.js'
import utilizadoresRoutes from './routes/utilizadores.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import { erroHandler } from './middlewares/erro.js'

const app = express()
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/bolsas', bolsasRoutes)
app.use('/api/candidaturas', candidaturasRoutes)
app.use('/api/mentorias', mentoriasRoutes)
app.use('/api/conta', contaRoutes)
app.use('/api/utilizadores', utilizadoresRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.use(erroHandler)

export default app
