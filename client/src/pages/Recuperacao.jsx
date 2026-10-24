import { useState } from 'react'
import api from '../services/api'

export default function Recuperacao() {
  const [passo, setPasso] = useState(1)
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')

  const pedir = async (e) => {
    e.preventDefault()
    setErro(''); setMsg('')
    try {
      const res = await api.post('/auth/recuperacao/pedir', { email })
      setMsg(res.data.mensagem)
      setPasso(2)
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro')
    }
  }

  const verificar = async (e) => {
    e.preventDefault()
    setErro(''); setMsg('')
    try {
      const res = await api.post('/auth/recuperacao/verificar', { email, codigo, novaSenha })
      setMsg(res.data.mensagem + ' Já pode iniciar sessão.')
      setPasso(3)
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Recuperação de senha</h1>
      {msg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{msg}</div>}
      {erro && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{erro}</div>}
      {passo === 1 && (
        <form onSubmit={pedir} className="bg-white p-6 rounded shadow space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Enviar código</button>
        </form>
      )}
      {passo === 2 && (
        <form onSubmit={verificar} className="bg-white p-6 rounded shadow space-y-4">
          <div>
            <label className="block text-sm mb-1">Código de 6 dígitos</label>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} maxLength={6} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Nova senha</label>
            <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Alterar senha</button>
        </form>
      )}
      {passo === 3 && <div className="text-center">Processo concluído.</div>}
    </div>
  )
}
