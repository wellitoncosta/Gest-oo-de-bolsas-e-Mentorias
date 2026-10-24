import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const cores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [minha, setMinha] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await api.get('/dashboard/estatisticas')
        setStats(res.data)
        if (user) {
          const m = await api.get('/dashboard/minha-area')
          setMinha(m.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [user])

  if (loading) return <div className="p-8 text-center">A carregar...</div>

  const candidaturasData = stats?.candidaturasPorEstado?.map((c, i) => ({ name: c.status, value: c._count.status, fill: cores[i % cores.length] })) || []
  const bolsasAreaData = stats?.bolsasPorArea?.map((b, i) => ({ name: b.area, total: b._count.area, fill: cores[i % cores.length] })) || []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow"><div className="text-sm text-gray-500">Bolsas abertas</div><div className="text-2xl font-bold">{stats?.bolsasAbertas || 0}</div></div>
        <div className="bg-white p-4 rounded shadow"><div className="text-sm text-gray-500">Mentores</div><div className="text-2xl font-bold">{stats?.totalMentores || 0}</div></div>
        <div className="bg-white p-4 rounded shadow"><div className="text-sm text-gray-500">Mentorias agendadas</div><div className="text-2xl font-bold">{stats?.mentoriasAgendadas || 0}</div></div>
        <div className="bg-white p-4 rounded shadow"><div className="text-sm text-gray-500">Candidaturas</div><div className="text-2xl font-bold">{candidaturasData.reduce((a,b)=>a+b.value,0)}</div></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-4">Bolsas por área</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bolsasAreaData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-4">Candidaturas por estado</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={candidaturasData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {candidaturasData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {user && minha && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-bold mb-4">Minha área</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">As minhas candidaturas</h3>
              {minha.candidaturas.length === 0 ? <p className="text-gray-500">Sem candidaturas</p> : (
                <ul className="space-y-2">
                  {minha.candidaturas.slice(0,5).map(c => <li key={c.id} className="border p-2 rounded"><div className="font-medium">{c.bolsa.titulo}</div><div className="text-sm text-gray-500">{c.status}</div></li>)}
                </ul>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">As minhas mentorias</h3>
              {minha.mentorias.length === 0 ? <p className="text-gray-500">Sem mentorias</p> : (
                <ul className="space-y-2">
                  {minha.mentorias.slice(0,5).map(m => <li key={m.id} className="border p-2 rounded"><div className="font-medium">{m.tema}</div><div className="text-sm text-gray-500">{m.status}</div></li>)}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
