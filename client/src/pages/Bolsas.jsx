import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Bolsas() {
  const [bolsas, setBolsas] = useState([])
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [loading, setLoading] = useState(true)

  const carregar = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (area) params.area = area
      const res = await api.get('/bolsas', { params })
      setBolsas(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Bolsas</h1>
      <div className="flex gap-4 mb-6 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar..." className="border rounded px-3 py-2" />
        <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Filtrar por área..." className="border rounded px-3 py-2" />
        <button onClick={carregar} className="px-4 py-2 bg-blue-600 text-white rounded">Filtrar</button>
      </div>
      {loading ? <div>A carregar...</div> : (
        <div className="grid md:grid-cols-2 gap-4">
          {bolsas.map(b => (
            <Link key={b.id} to={`/bolsas/${b.id}`} className="bg-white p-4 rounded shadow hover:shadow-md">
              <div className="flex justify-between">
                <h2 className="font-bold text-lg">{b.titulo}</h2>
                <span className={`text-xs px-2 py-1 rounded ${b.status === 'ABERTA' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{b.status}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{b.entidade} • {b.area}</p>
              <p className="text-sm line-clamp-2">{b.descricao}</p>
              {b.valor && <p className="text-sm mt-2 font-medium">{b.valor}</p>}
            </Link>
          ))}
        </div>
      )}
      {bolsas.length === 0 && !loading && <p className="text-gray-500">Nenhuma bolsa encontrada.</p>}
    </div>
  )
}
