import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Mentorias() {
  const { user } = useAuth()
  const [mentorias, setMentorias] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = async () => {
    try {
      const res = await api.get('/mentorias/minhas')
      setMentorias(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const atualizar = async (id, status) => {
    try {
      await api.put(`/mentorias/${id}/estado`, { status })
      carregar()
    } catch (e) {
      alert(e.response?.data?.mensagem || 'Erro')
    }
  }

  if (loading) return <div className="p-8 text-center">A carregar...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mentorias</h1>
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
                  </>
                )}
                {user.role === 'ESTUDANTE' && (m.status === 'PENDENTE' || m.status === 'CONFIRMADA') && (
                  <button onClick={() => atualizar(m.id, 'CANCELADA')} className="px-3 py-1 bg-gray-600 text-white rounded text-sm">Cancelar</button>
                )}
                {user.role === 'MENTOR' && m.status === 'CONFIRMADA' && (
                  <button onClick={() => atualizar(m.id, 'CONCLUIDA')} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Marcar como concluída</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
