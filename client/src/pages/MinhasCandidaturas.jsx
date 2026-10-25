import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import { useTranslation } from 'react-i18next'
import { localeFor } from '../i18n'
import { traduzirErro, traduzirEstado } from '../services/traduzirErro'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import { useRealtime } from '../context/RealtimeContext'
import { conteudo, conteudoTemFallback } from '../services/conteudo'

export default function MinhasCandidaturas() {
  const { t, i18n } = useTranslation(['scholarships', 'common', 'mentoring'])
  const toast = useToast()
  const confirm = useConfirm()
  const [cands, setCands] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/candidaturas/minhas')
      setCands(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])
  useRealtime(['candidatura:estado', 'estatisticas:alteradas'], ({ evento }) => {
    carregar()
    if (evento === 'candidatura:estado') toast.success(t('scholarships:applicationStatusUpdated'))
  })

  const cancelar = async (id) => {
    if (!(await confirm({ message: t('mentoring:cancelConfirm') }))) return
    try {
      await api.delete(`/candidaturas/${id}`)
      carregar()
      toast.success(t('scholarships:applicationCancelled'))
    } catch (err) {
      toast.error(traduzirErro(err))
    }
  }

  if (loading)
    return (
      <div className="mx-auto grid max-w-content gap-4 px-5 py-12">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('scholarships:mine')}</h1>
      {cands.length === 0 ? (
        <EmptyState title={t('scholarships:noneMine')} />
      ) : (
        <div className="space-y-3">
          {cands.map((c) => (
            <div key={c.id} className="animate-fade-in bg-surface p-4 rounded shadow">
              <div className="flex justify-between mb-2">
                <div>
                  <div className="font-bold">{conteudo(c.bolsa, 'titulo', i18n.language)}</div>
                  {conteudoTemFallback(c.bolsa, ['titulo'], i18n.language) && (
                    <div className="text-xs text-muted">{t('common:contentFallback')}</div>
                  )}
                  <div className="text-sm text-muted">{c.bolsa?.entidade}</div>
                  <div className="text-sm text-muted">
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleDateString(localeFor(i18n.language))
                      : ''}
                  </div>
                </div>
                <Badge
                  className="h-fit"
                  tone={
                    c.status === 'APROVADA'
                      ? 'success'
                      : c.status === 'REJEITADA'
                        ? 'danger'
                        : 'neutral'
                  }
                >
                  {traduzirEstado(c.status)}
                </Badge>
              </div>
              {c.status === 'PENDENTE' && (
                <button
                  onClick={() => cancelar(c.id)}
                  className="rounded-lg bg-brand px-3 py-1 text-sm text-bg"
                >
                  {t('scholarships:cancelApplication')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
