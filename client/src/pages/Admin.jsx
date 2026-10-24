import { useEffect, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import api from '../services/api'

function BolsasAdmin() {
  const [bolsas, setBolsas] = useState([])
  const [form, setForm] = useState({ titulo: '', descricao: '', entidade: '', valor: '', requisitos: '', area: '', dataLimite: '', status: 'ABERTA' })
  const [editando, setEditando] = useState(null)

  const carregar = async () => {
    const res = await api.get('/bolsas')
    setBolsas(res.data)
  }
  useEffect(() => { carregar() }, [])

  const criar = async (e) => {
    e.preventDefault()
    if (editando) {
      await api.put(`/bolsas/${editando}`, form)
      setEditando(null)
    } else {
      await api.post('/bolsas', form)
    }
    setForm({ titulo: '', descricao: '', entidade: '', valor: '', requisitos: '', area: '', dataLimite: '', status: 'ABERTA' })
    carregar()
  }

  const editar = (b) => {
    setEditando(b.id)
    setForm({ titulo: b.titulo, descricao: b.descricao, entidade: b.entidade, valor: b.valor || '', requisitos: b.requisitos || '', area: b.area, dataLimite: b.dataLimite.split('T')[0], status: b.status })
  }

  const remover = async (id) => {
    if (!confirm('Remover bolsa?')) return
    await api.delete(`/bolsas/${id}`)
    carregar()
  }

  return (
    <div>
      <h2 className="font-bold text-xl mb-4">Gestão de Bolsas</h2>
      <form onSubmit={criar} className="bg-white p-4 rounded shadow mb-6 grid md:grid-cols-2 gap-3">
        <input placeholder="Título" value={form.titulo} onChange={(e) => setForm({...form, titulo: e.target.value})} className="border rounded px-3 py-2" required />
        <input placeholder="Entidade" value={form.entidade} onChange={(e) => setForm({...form, entidade: e.target.value})} className="border rounded px-3 py-2" required />
        <input placeholder="Área" value={form.area} onChange={(e) => setForm({...form, area: e.target.value})} className="border rounded px-3 py-2" required />
        <input placeholder="Valor" value={form.valor} onChange={(e) => setForm({...form, valor: e.target.value})} className="border rounded px-3 py-2" />
        <input type="date" value={form.dataLimite} onChange={(e) => setForm({...form, dataLimite: e.target.value})} className="border rounded px-3 py-2" required />
        <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="border rounded px-3 py-2">
          <option value="ABERTA">Aberta</option>
          <option value="FECHADA">Fechada</option>
        </select>
        <textarea placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({...form, descricao: e.target_value || e.target.value})} className="border rounded px-3 py-2 md:col-span-2" rows={2}></textarea>
        <textarea placeholder="Requisitos" value={form.requisitos} onChange={(e) => setForm({...form, requisitos: e.target.value})} className="border rounded px-3 py-2 md:col-span-2" rows={2}></textarea>
        <button className="px-4 py-2 bg-blue-600 text-white rounded md:col-span-2">{editando ? 'Atualizar' : 'Criar'}</button>
      </form>
      <div className="space-y-2">
        {bolsas.map(b => (
          <div key={b.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
            <div><div className="font-medium">{b.titulo}</div><div className="text-sm text-gray-500">{b.entidade} • {b.status}</div></div>
            <div className="flex gap-2">
              <button onClick={() => editar(b)} className="px-3 py-1 bg-gray-200 rounded text-sm">Editar</button>
              <button onClick={() => remover(b.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UtilizadoresAdmin() {
  const [users, setUsers] = useState([])
  const [erro, setErro] = useState('')
  const carregar = async () => {
    const res = await api.get('/utilizadores')
    setUsers(res.data)
  }
  useEffect(() => { carregar() }, [])
  const alterar = async (u) => {
    setErro('')
    if (u.role === 'ADMIN') return
    if (!confirm(u.bloqueado ? 'Desbloquear utilizador?' : 'Bloquear utilizador?')) return
    try {
      const res = await api.put(`/utilizadores/${u.id}/bloqueio`, { bloqueado: !u.bloqueado })
      setUsers(users.map(x => x.id === u.id ? res.data : x))
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro')
    }
  }
  return (
    <div>
      <h2 className="font-bold text-xl mb-4">Utilizadores</h2>
      {erro && <div className="mb-3 p-3 bg-red-100 text-red-700 rounded">{erro}</div>}
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
            <div>
              <div className="font-medium">{u.nome}</div>
              <div className="text-sm text-gray-500">{u.email} • {u.role} • <span className={u.bloqueado ? 'text-red-600' : 'text-green-600'}>{u.bloqueado ? 'Bloqueado' : 'Ativo'}</span></div>
            </div>
            {u.role !== 'ADMIN' ? (
              <button onClick={() => alterar(u)} className={`px-3 py-1 rounded text-sm ${u.bloqueado ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{u.bloqueado ? 'Desbloquear' : 'Bloquear'}</button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function CandidaturasAdmin() {
  const [cands, setCands] = useState([])
  const [filtro, setFiltro] = useState('TODAS')
  const [pesquisa, setPesquisa] = useState('')
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const carregar = async () => {
    const res = await api.get('/candidaturas')
    setCands(res.data)
  }
  useEffect(() => { carregar() }, [])
  const atualizar = async (id, status) => {
    setErro(''); setMsg('')
    try {
      await api.put(`/candidaturas/${id}/estado`, { status })
      setMsg(status === 'APROVADA' ? 'Candidatura aprovada' : status === 'REJEITADA' ? 'Candidatura rejeitada' : 'Candidatura revertida para pendente')
      carregar()
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro ao atualizar candidatura')
    }
  }
  const cor = (s) => s === 'APROVADA' ? 'bg-green-100 text-green-700' : s === 'REJEITADA' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
  const filtradas = cands.filter(c => {
    if (filtro !== 'TODAS' && c.status !== filtro) return false
    if (pesquisa) {
      const p = pesquisa.toLowerCase()
      if (!(c.bolsa?.titulo?.toLowerCase().includes(p) || c.user?.nome?.toLowerCase().includes(p))) return false
    }
    return true
  })
  return (
    <div>
      <h2 className="font-bold text-xl mb-4">Candidaturas</h2>
      {msg && <div className="mb-3 p-3 bg-green-100 text-green-700 rounded">{msg}</div>}
      {erro && <div className="mb-3 p-3 bg-red-100 text-red-700 rounded">{erro}</div>}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="border rounded px-3 py-2">
          <option value="TODAS">Todas</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="APROVADA">Aprovadas</option>
          <option value="REJEITADA">Rejeitadas</option>
        </select>
        <input value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Pesquisar por bolsa ou candidato" className="border rounded px-3 py-2" />
      </div>
      <div className="space-y-2">
        {filtradas.map(c => (
          <div key={c.id} className="bg-white p-3 rounded shadow">
            <div className="flex justify-between mb-2">
              <div>
                <div className="font-medium">{c.user?.nome} ({c.user?.email}) - {c.bolsa?.titulo}</div>
                <div className="text-sm text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleString('pt-PT') : ''}</div>
                <span className={`text-xs px-2 py-1 rounded ${cor(c.status)}`}>{c.status}</span>
              </div>
              <div className="flex gap-2">
                {c.status === 'PENDENTE' && (
                  <>
                    <button onClick={() => atualizar(c.id, 'APROVADA')} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Aprovar</button>
                    <button onClick={() => atualizar(c.id, 'REJEITADA')} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Rejeitar</button>
                  </>
                )}
                {c.status !== 'PENDENTE' && (
                  <button onClick={() => atualizar(c.id, 'PENDENTE')} className="px-3 py-1 bg-yellow-600 text-white rounded text-sm">Reverter para pendente</button>
                )}
              </div>
            </div>
            {c.mensagem && <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.mensagem}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function MentoriasAdmin() {
  const [mentorias, setMentorias] = useState([])
  const carregar = async () => {
    const res = await api.get('/mentorias')
    setMentorias(res.data)
  }
  useEffect(() => { carregar() }, [])
  return (
    <div>
      <h2 className="font-bold text-xl mb-4">Mentorias</h2>
      <div className="space-y-2">
        {mentorias.map(m => (
          <div key={m.id} className="bg-white p-3 rounded shadow">
            <div className="font-medium">{m.tema}</div>
            <div className="text-sm text-gray-500">Mentor: {m.mentor.nome} • Estudante: {m.estudante.nome} • {m.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Admin() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Administração</h1>
      <div className="flex gap-4 mb-6 flex-wrap">
        <Link to="/admin" className="px-4 py-2 bg-blue-600 text-white rounded">Bolsas</Link>
        <Link to="/admin/utilizadores" className="px-4 py-2 bg-gray-200 rounded">Utilizadores</Link>
        <Link to="/admin/candidaturas" className="px-4 py-2 bg-gray-200 rounded">Candidaturas</Link>
        <Link to="/admin/mentorias" className="px-4 py-2 bg-gray-200 rounded">Mentorias</Link>
      </div>
      <Routes>
        <Route path="/" element={<BolsasAdmin />} />
        <Route path="/utilizadores" element={<UtilizadoresAdmin />} />
        <Route path="/candidaturas" element={<CandidaturasAdmin />} />
        <Route path="/mentorias" element={<MentoriasAdmin />} />
      </Routes>
    </div>
  )
}
