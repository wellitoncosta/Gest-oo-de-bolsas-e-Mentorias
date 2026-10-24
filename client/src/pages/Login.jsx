import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const mensagem = location.state?.mensagem

  const submeter = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      await login(email, senha)
      navigate(location.state?.from?.pathname || '/dashboard')
    } catch (err) {
      if (err.response?.data?.codigo === 'CONTA_BLOQUEADA') {
        setErro(err.response?.data?.mensagem)
      } else {
        setErro(err.response?.data?.mensagem || 'Erro ao iniciar sessão')
      }
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Entrar</h1>
      {mensagem && <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">{mensagem}</div>}
      {erro && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{erro}</div>}
      <form onSubmit={submeter} className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Entrar</button>
      </form>
      <div className="mt-4 text-sm flex justify-between">
        <Link to="/registo" className="text-blue-600">Criar conta</Link>
        <Link to="/recuperacao" className="text-blue-600">Recuperar senha</Link>
      </div>
    </div>
  )
}
