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
  const carregar = async () => {
    const res = await api.get('/utilizadores')
    setUsers(res.data)
  }
  useEffect(() => { carregar() }, [])
  const remover = async (id) => {
    if (!confirm('Remover utilizador?')) return
    await api.delete(`/utilizadores/${id}`)
    carregar()
  }
  return (
    <div>
      <h2 className="font-bold text-xl mb-4">Utilizadores</h2>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
            <div><div className="font-medium">{u.nome}</div><div className="text-sm text-gray-500">{u.email} • {u.role}</div></div>
            <button onClick={() => remover(u.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Remover</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function CandidaturasAdmin() {
  const [cands, setCands] = useState([])
  const carregar = async () => {
    const res = await api.get('/candidaturas')
    setCands(res.data)
  }
  useEffect(() => { carregar() }, [])
  const atualizar = async (id, status) => {
    await api.put(`/candidaturas/${id}/estado`, { status })
    carregar()
  }
  return (
    <div>
      <h2 className="font-bold text-xl mb-4">Candidaturas</h2>
      <div className="space-y-2">
        {cands.map(c => (
          <div key={c.id} className="bg-white p-3 rounded shadow">
            <div className="flex justify-between mb-2">
              <div><div className="font-medium">{c.user.nome} - {c.bolsa.titulo}</div><div className="text-sm text-gray-500">{c.status}</div></div>
              <div className="flex gap-2">
                <button onClick={() => atualizar(c.id, 'APROVADA')} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Aprovar</button>
                <button onClick={() => atualizar(c.id, 'REJEITADA')} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Rejeitar</button>
              </div>
            </div>
            {c.mensagem && <p className="text-sm text-gray-600">{c.mensagem}</p>}
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
