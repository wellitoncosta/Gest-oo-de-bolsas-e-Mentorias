import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Recuperacao() {
  const [passo, setPasso] = useState(1)
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const [contador, setContador] = useState(0)

  useEffect(() => {
    if (contador <= 0) return
    const t = setInterval(() => setContador(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [contador])

  const pedir = async (e) => {
    e.preventDefault()
    setErro(''); setMsg('')
    try {
      const res = await api.post('/auth/recuperacao/pedir', { email })
      setMsg(res.data.mensagem)
      setPasso(2)
      setContador(60)
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro')
    }
  }

  const reenviar = async () => {
    if (contador > 0) return
    setErro(''); setMsg('')
    try {
      const res = await api.post('/auth/recuperacao/pedir', { email })
      setMsg(res.data.mensagem)
      setContador(60)
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro')
    }
  }

  const verificar = async (e) => {
    e.preventDefault()
    setErro(''); setMsg('')
    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem')
      return
    }
    try {
      const res = await api.post('/auth/recuperacao/verificar', { email, codigo: codigo.replace(/\s/g, ''), novaSenha })
      setMsg(res.data.mensagem)
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
          <div className="text-sm text-gray-600">Código enviado para: <strong>{email}</strong></div>
          <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded">Use apenas o código do email mais recente</div>
          <div>
            <label className="block text-sm mb-1">Código de 6 dígitos</label>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\s/g, ''))} inputMode="numeric" pattern="\d{6}" maxLength={6} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Nova senha</label>
            <div className="flex gap-2">
              <input type={mostrar ? 'text' : 'password'} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="w-full border rounded px-3 py-2" required />
              <button type="button" onClick={() => setMostrar(!mostrar)} className="px-3 border rounded">{mostrar ? 'Ocultar' : 'Mostrar'}</button>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Confirmar nova senha</label>
            <input type={mostrar ? 'text' : 'password'} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Alterar senha</button>
          <button type="button" onClick={reenviar} disabled={contador > 0} className="w-full border py-2 rounded disabled:text-gray-400">{contador > 0 ? `Reenviar código (${contador}s)` : 'Reenviar código'}</button>
        </form>
      )}
      {passo === 3 && (
        <div className="text-center bg-white p-6 rounded shadow">
          <p className="mb-4">Processo concluído.</p>
          <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded">Ir para o login</Link>
        </div>
      )}
    </div>
  )
}
