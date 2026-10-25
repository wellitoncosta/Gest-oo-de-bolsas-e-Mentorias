import { useEffect, useState } from 'react'
import api from '../services/api'
import { useTranslation } from 'react-i18next'
import { localeFor } from '../i18n'
import { traduzirErro, traduzirEstado } from '../services/traduzirErro'

export default function MinhasCandidaturas() {
  const { t, i18n } = useTranslation(['scholarships', 'common', 'mentoring'])
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
    if (!confirm(t('mentoring:cancelConfirm'))) return
    try {
      await api.delete(`/candidaturas/${id}`)
      carregar()
    } catch (err) {
      alert(traduzirErro(err))
    }
  }

  const cor = (s) => s === 'APROVADA' ? 'bg-accent/10 text-accent' : s === 'REJEITADA' ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'

  if (loading) return <div className="p-8 text-center">{t('common:loading')}</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('scholarships:mine')}</h1>
      {cands.length === 0 ? <p className="text-muted">{t('scholarships:noneMine')}</p> : (
        <div className="space-y-3">
          {cands.map(c => (
            <div key={c.id} className="bg-surface p-4 rounded shadow">
              <div className="flex justify-between mb-2">
                <div>
                  <div className="font-bold">{c.bolsa?.titulo}</div>
                  <div className="text-sm text-muted">{c.bolsa?.entidade}</div>
                  <div className="text-sm text-muted">{c.createdAt ? new Date(c.createdAt).toLocaleDateString(localeFor(i18n.language)) : ''}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full h-fit ${cor(c.status)}`}>{traduzirEstado(c.status)}</span>
              </div>
              {c.status === 'PENDENTE' && (
                <button onClick={() => cancelar(c.id)} className="rounded-lg bg-brand px-3 py-1 text-sm text-bg">{t('scholarships:cancelApplication')}</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
