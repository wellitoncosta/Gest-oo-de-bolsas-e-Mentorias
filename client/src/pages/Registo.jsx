import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Registo() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', role: 'ESTUDANTE' })
  const [erro, setErro] = useState('')
  const { registar } = useAuth()
  const navigate = useNavigate()

  const submeter = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      await registar(form)
      navigate('/dashboard')
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro ao registar')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Registo</h1>
      {erro && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{erro}</div>}
      <form onSubmit={submeter} className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <label className="block text-sm mb-1">Nome</label>
          <input value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Senha</label>
          <input type="password" value={form.senha} onChange={(e) => setForm({...form, senha: e.target.value})} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Perfil</label>
          <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="w-full border rounded px-3 py-2">
            <option value="ESTUDANTE">Estudante</option>
            <option value="MENTOR">Mentor</option>
          </select>
        </div>
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Registar</button>
      </form>
      <div className="mt-4 text-sm">
        <Link to="/login" className="text-blue-600">Já tenho conta</Link>
      </div>
    </div>
  )
}
