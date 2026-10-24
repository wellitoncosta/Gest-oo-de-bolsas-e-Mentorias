import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function MinhaConta() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [form, setForm] = useState({})
  const [senha, setSenha] = useState({ atual: '', nova: '' })
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    const carregar = async () => {
      const res = await api.get('/conta')
      setPerfil(res.data)
      setForm(res.data)
    }
    carregar()
  }, [])

  const guardar = async (e) => {
    e.preventDefault()
    setErro(''); setMsg('')
    try {
      const res = await api.put('/conta', form)
      setPerfil(res.data)
      setMsg('Perfil atualizado')
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro')
    }
  }

  const alterar = async (e) => {
    e.preventDefault()
    setErro(''); setMsg('')
    try {
      const res = await api.put('/conta/senha', senha)
      setMsg(res.data.mensagem)
      setSenha({ atual: '', nova: '' })
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro')
    }
  }

  const apagar = async () => {
    const senha = prompt('Para apagar a conta, introduza a sua senha atual:')
    if (!senha) return
    if (!confirm('Tem a certeza que deseja apagar a sua conta? Esta ação não pode ser revertida.')) return
    try {
      await api.delete('/conta', { data: { senha } })
      await logout()
      navigate('/')
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro')
    }
  }

  if (!perfil) return <div className="p-8 text-center">A carregar...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Minha Conta</h1>
      {msg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{msg}</div>}
      {erro && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{erro}</div>}
      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={guardar} className="bg-white p-4 rounded shadow space-y-3">
          <h2 className="font-bold">Perfil</h2>
          <div><label className="block text-sm">Nome</label><input value={form.nome || ''} onChange={(e) => setForm({...form, nome: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block text-sm">Telefone</label><input value={form.telefone || ''} onChange={(e) => setForm({...form, telefone: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block text-sm">Área</label><input value={form.area || ''} onChange={(e) => setForm({...form, area: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block text-sm">Instituição</label><input value={form.instituicao || ''} onChange={(e) => setForm({...form, instituicao: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
          <div><label className="block text-sm">Biografia</label><textarea value={form.biografia || ''} onChange={(e) => setForm({...form, biografia: e.target.value})} className="w-full border rounded px-3 py-2" rows={3}></textarea></div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
        </form>
        <div className="space-y-6">
          <form onSubmit={alterar} className="bg-white p-4 rounded shadow space-y-3">
            <h2 className="font-bold">Alterar senha</h2>
            <div><label className="block text-sm">Senha atual</label><input type="password" value={senha.atual} onChange={(e) => setSenha({...senha, atual: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm">Nova senha</label><input type="password" value={senha.nova} onChange={(e) => setSenha({...senha, nova: e.target.value})} className="w-full border rounded px-3 py-2" /></div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Alterar</button>
          </form>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-bold mb-2 text-red-600">Zona perigosa</h2>
            <button onClick={apagar} className="px-4 py-2 bg-red-600 text-white rounded">Apagar a minha conta</button>
          </div>
        </div>
      </div>
    </div>
  )
}
