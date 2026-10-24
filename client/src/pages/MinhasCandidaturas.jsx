import { useEffect, useState } from 'react'
import api from '../services/api'

export default function MinhasCandidaturas() {
  const [cands, setCands] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = async () => {
    try {
      const res = await api.get('/candidaturas/minhas')
      setCands(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const cancelar = async (id) => {
    if (!confirm('Cancelar candidatura?')) return
    try {
      await api.delete(`/candidaturas/${id}`)
      carregar()
    } catch (err) {
      alert(err.response?.data?.mensagem || 'Erro')
    }
  }

  const cor = (s) => s === 'APROVADA' ? 'bg-green-100 text-green-700' : s === 'REJEITADA' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'

  if (loading) return <div className="p-8 text-center">A carregar...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Minhas candidaturas</h1>
      {cands.length === 0 ? <p className="text-gray-500">Sem candidaturas</p> : (
        <div className="space-y-3">
          {cands.map(c => (
            <div key={c.id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between mb-2">
                <div>
                  <div className="font-bold">{c.bolsa?.titulo}</div>
                  <div className="text-sm text-gray-600">{c.bolsa?.entidade}</div>
                  <div className="text-sm text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-PT') : ''}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded h-fit ${cor(c.status)}`}>{c.status}</span>
              </div>
              {c.status === 'PENDENTE' && (
                <button onClick={() => cancelar(c.id)} className="px-3 py-1 bg-gray-600 text-white rounded text-sm">Cancelar candidatura</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
