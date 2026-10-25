import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useTranslation } from 'react-i18next'
import { traduzirEstado } from '../services/traduzirErro'

export default function Bolsas() {
  const { t } = useTranslation(['scholarships', 'common'])
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
    <div className="max-w-content mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('scholarships:title')}</h1>
      <div className="flex gap-4 mb-6 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('common:search')} className="rounded-xl border border-border px-3 py-2" />
        <input value={area} onChange={(e) => setArea(e.target.value)} placeholder={t('scholarships:searchArea')} className="rounded-xl border border-border px-3 py-2" />
        <button onClick={carregar} className="rounded-xl bg-brand px-4 py-2 text-bg">{t('common:filter')}</button>
      </div>
      {loading ? <div>{t('common:loading')}</div> : (
        <div className="grid md:grid-cols-2 gap-4">
          {bolsas.map(b => (
            <Link key={b.id} to={`/bolsas/${b.id}`} className="bg-surface p-4 rounded shadow hover:shadow-md">
              <div className="flex justify-between">
                <h2 className="font-bold text-lg">{b.titulo}</h2>
                <span className={`rounded-full px-2 py-1 text-xs ${b.status === 'ABERTA' ? 'bg-accent/10 text-accent' : 'bg-bg text-muted'}`}>{traduzirEstado(b.status)}</span>
              </div>
              <p className="text-sm text-muted mb-2">{b.entidade} • {b.area}</p>
              <p className="text-sm line-clamp-2">{b.descricao}</p>
              {b.valor && <p className="text-sm mt-2 font-medium">{b.valor}</p>}
            </Link>
          ))}
        </div>
      )}
      {bolsas.length === 0 && !loading && <p className="text-muted">{t('scholarships:none')}</p>}
    </div>
  )
}
