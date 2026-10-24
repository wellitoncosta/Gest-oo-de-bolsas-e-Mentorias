import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Mentorias() {
  const { user } = useAuth()
  const [mentorias, setMentorias] = useState([])
  const [horarios, setHorarios] = useState([])
  const [form, setForm] = useState({ data: '', horaInicio: '', horaFim: '' })
  const [loading, setLoading] = useState(true)

  const carregar = async () => {
    try {
      const res = await api.get('/mentorias/minhas')
      setMentorias(res.data)
      if (user?.role === 'MENTOR') {
        const h = await api.get('/mentorias/minhas-disponibilidades')
        setHorarios(h.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [user])

  const atualizar = async (id, status) => {
    try {
      await api.put(`/mentorias/${id}/estado`, { status })
      carregar()
    } catch (e) {
      alert(e.response?.data?.mensagem || 'Erro')
    }
  }

  const criarHorario = async (e) => {
    e.preventDefault()
    try {
      await api.post('/mentorias/disponibilidades', form)
      setForm({ data: '', horaInicio: '', horaFim: '' })
      carregar()
    } catch (err) {
      alert(err.response?.data?.mensagem || 'Erro ao criar horário')
    }
  }

  const removerHorario = async (id) => {
    if (!confirm('Remover este horário?')) return
    try {
      await api.delete(`/mentorias/disponibilidades/${id}`)
      carregar()
    } catch (err) {
      alert(err.response?.data?.mensagem || 'Erro ao remover')
    }
  }

  if (loading) return <div className="p-8 text-center">A carregar...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mentorias</h1>

      {user?.role === 'MENTOR' && (
        <div className="mb-8">
          <h2 className="font-bold text-xl mb-4">Meus horários</h2>
          <form onSubmit={criarHorario} className="bg-white p-4 rounded shadow mb-4 grid md:grid-cols-4 gap-3">
            <input type="date" value={form.data} onChange={(e) => setForm({...form, data: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="time" value={form.horaInicio} onChange={(e) => setForm({...form, horaInicio: e.target.value})} className="border rounded px-3 py-2" required />
            <input type="time" value={form.horaFim} onChange={(e) => setForm({...form, horaFim: e.target.value})} className="border rounded px-3 py-2" required />
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Criar horário</button>
          </form>
          <div className="space-y-2">
            {horarios.map(h => (
              <div key={h.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
                <div>
                  <div className="font-medium">{new Date(h.data).toLocaleDateString('pt-PT')} • {h.horaInicio} - {h.horaFim}</div>
                  <div className="text-sm text-gray-500">{h.status === 'LIVRE' ? 'Livre' : `Ocupado (estudante: ${h.estudanteNome})`}</div>
                </div>
                <button onClick={() => removerHorario(h.id)} disabled={h.status === 'OCUPADO'} className={`px-3 py-1 rounded text-sm ${h.status === 'OCUPADO' ? 'bg-gray-200 text-gray-400' : 'bg-red-600 text-white'}`}>Remover</button>
              </div>
            ))}
            {horarios.length === 0 && <p className="text-gray-500">Sem horários criados.</p>}
          </div>
        </div>
      )}

      <h2 className="font-bold text-xl mb-4">Mentorias</h2>
      {mentorias.length === 0 ? <p className="text-gray-500">Sem mentorias</p> : (
        <div className="space-y-3">
          {mentorias.map(m => (
            <div key={m.id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between mb-2">
                <div>
                  <div className="font-bold">{m.tema}</div>
                  <div className="text-sm text-gray-600">{user.role === 'MENTOR' ? `Estudante: ${m.estudante.nome}` : `Mentor: ${m.mentor.nome}`}</div>
                  {m.disponibilidade && <div className="text-sm text-gray-600">{new Date(m.disponibilidade.data).toLocaleDateString('pt-PT')} • {m.disponibilidade.horaInicio} - {m.disponibilidade.horaFim}</div>}
                </div>
                <span className="text-xs px-2 py-1 rounded h-fit bg-gray-100">{m.status}</span>
              </div>
              <div className="flex gap-2 mt-3">
                {user.role === 'MENTOR' && m.status === 'PENDENTE' && (
                  <>
                    <button onClick={() => atualizar(m.id, 'CONFIRMADA')} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Confirmar</button>
                    <button onClick={() => atualizar(m.id, 'RECUSADA')} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Recusar</button>
                    <button onClick={() => atualizar(m.id, 'CANCELADA')} className="px-3 py-1 bg-gray-600 text-white rounded text-sm">Cancelar</button>
                  </>
                )}
                {user.role === 'MENTOR' && m.status === 'CONFIRMADA' && (
                  <>
                    <button onClick={() => atualizar(m.id, 'CONCLUIDA')} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Marcar como concluída</button>
                    <button onClick={() => atualizar(m.id, 'CANCELADA')} className="px-3 py-1 bg-gray-600 text-white rounded text-sm">Cancelar</button>
                  </>
                )}
                {user.role === 'ESTUDANTE' && (m.status === 'PENDENTE' || m.status === 'CONFIRMADA') && (
                  <button onClick={() => atualizar(m.id, 'CANCELADA')} className="px-3 py-1 bg-gray-600 text-white rounded text-sm">Cancelar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
