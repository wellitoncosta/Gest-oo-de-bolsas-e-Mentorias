import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useTranslation } from 'react-i18next'
import { traduzirEstado } from '../services/traduzirErro'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { useRealtime } from '../context/RealtimeContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import AreaSelect from '../components/AreaSelect'
import { conteudo, conteudoTemFallback, formatarValor } from '../services/conteudo'
import { useTranslation as useI18n } from 'react-i18next'

export default function Bolsas() {
  const { t } = useTranslation(['scholarships', 'common'])
  const { t: ta, i18n } = useI18n(['areas'])
  const toast = useToast()
  const { user } = useAuth()
  const [bolsas, setBolsas] = useState([])
  const [novaBolsaId, setNovaBolsaId] = useState(null)
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!silencioso) setLoading(true)
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
    },
    [search, area],
  )

  useEffect(() => {
    carregar()
  }, [carregar])

  useRealtime(['bolsa:criada', 'bolsa:atualizada', 'bolsa:removida'], ({ evento, dados }) => {
    if (evento === 'bolsa:criada' && user?.role === 'ESTUDANTE') {
      setNovaBolsaId(dados.id)
      toast.successLink(
        t('scholarships:newScholarship', { title: conteudo(dados, 'titulo', i18n.language) }),
        `/bolsas/${dados.id}`,
      )
    }
    carregar({ silencioso: true })
  })

  return (
    <div className="max-w-content mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('scholarships:title')}</h1>
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common:search')}
          className="rounded-xl border border-border px-3 py-2"
        />
        <AreaSelect
          includeEmpty
          value={area}
          onChange={setArea}
          className="rounded-xl border border-border px-3 py-2"
        />
        <button onClick={carregar} className="rounded-xl bg-brand px-4 py-2 text-bg">
          {t('common:filter')}
        </button>
      </div>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-52" />
          ))}
        </div>
      ) : bolsas.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {bolsas.map((b) => (
            <Link
              key={b.id}
              to={`/bolsas/${b.id}`}
              className={`group rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${b.id === novaBolsaId ? 'animate-fade-in ring-2 ring-accent/40' : ''}`}
            >
              <div className="flex justify-between">
                <h2 className="text-lg font-bold group-hover:text-brand dark:group-hover:text-accent">
                  {conteudo(b, 'titulo', i18n.language)}
                </h2>
                <Badge tone={b.status === 'ABERTA' ? 'success' : 'neutral'}>
                  {traduzirEstado(b.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted mb-2">
                {b.entidade} • {ta(b.area)}
              </p>
              <p className="text-sm line-clamp-2">{conteudo(b, 'descricao', i18n.language)}</p>
              {conteudo(b, 'valor', i18n.language) && (
                <p className="text-sm mt-2 font-medium">
                  {formatarValor(conteudo(b, 'valor', i18n.language), i18n.language)}
                </p>
              )}
              {conteudoTemFallback(
                b,
                ['titulo', 'descricao', 'valor', 'requisitos'],
                i18n.language,
              ) && <p className="mt-2 text-xs text-muted">{t('common:contentFallback')}</p>}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title={t('scholarships:none')} />
      )}
    </div>
  )
}
