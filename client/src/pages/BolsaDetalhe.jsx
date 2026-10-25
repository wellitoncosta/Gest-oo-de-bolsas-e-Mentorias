import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { localeFor } from '../i18n'
import { traduzirErro, traduzirEstado } from '../services/traduzirErro'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { Building2, CalendarDays, Coins, MapPin } from 'lucide-react'

export default function BolsaDetalhe() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['scholarships', 'common'])
  const [bolsa, setBolsa] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await api.get(`/bolsas/${id}`)
        setBolsa(res.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [id])

  const candidatar = async () => {
    if (!user) {
      navigate('/login', {
        state: { from: { pathname: `/bolsas/${id}` }, mensagem: t('scholarships:loginToApply') },
      })
      return
    }
    setErro('')
    setSucesso('')
    try {
      await api.post(`/candidaturas/bolsa/${id}`, { mensagem })
      setSucesso(t('scholarships:sent'))
    } catch (err) {
      setErro(traduzirErro(err))
    }
  }

  if (loading)
    return (
      <div className="mx-auto grid max-w-4xl gap-4 px-5 py-12">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-80" />
      </div>
    )
  if (!bolsa)
    return (
      <div className="mx-auto max-w-4xl px-5 py-12">
        <EmptyState title={t('scholarships:notFound')} />
      </div>
    )

  const prazoPassado = bolsa.dataLimite ? new Date(bolsa.dataLimite) < new Date() : false
  const podeCandidatar = bolsa.status === 'ABERTA' && !prazoPassado

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">{bolsa.titulo}</h1>
          <Badge
            className="h-fit"
            tone={bolsa.status === 'ABERTA' && !prazoPassado ? 'success' : 'neutral'}
          >
            {prazoPassado ? t('scholarships:expired') : traduzirEstado(bolsa.status)}
          </Badge>
        </div>
        <div className="mb-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-2">
            <Building2 size={16} />
            {bolsa.entidade}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin size={16} />
            {bolsa.area}
          </span>
        </div>
        <div className="space-y-4 mb-6">
          <div>
            <h2 className="font-semibold">{t('common:description')}</h2>
            <p className="text-text whitespace-pre-wrap">{bolsa.descricao}</p>
          </div>
          {bolsa.requisitos && (
            <div>
              <h2 className="font-semibold">{t('common:requirements')}</h2>
              <p className="text-text whitespace-pre-wrap">{bolsa.requisitos}</p>
            </div>
          )}
          {bolsa.valor && (
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                <Coins size={17} />
                {t('common:amount')}
              </h2>
              <p className="text-text">{bolsa.valor}</p>
            </div>
          )}
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <CalendarDays size={17} />
              {t('common:deadline')}
            </h2>
            <p className="text-text">
              {new Date(bolsa.dataLimite).toLocaleDateString(localeFor(i18n.language))}
            </p>
          </div>
        </div>
        {podeCandidatar && (
          <div className="border-t pt-4">
            <h2 className="font-semibold mb-2">{t('scholarships:apply')}</h2>
            {erro && <div className="mb-3 p-3 bg-danger/10 text-danger rounded">{erro}</div>}
            {sucesso && <div className="mb-3 p-3 bg-accent/10 text-accent rounded">{sucesso}</div>}
            {user?.role === 'ESTUDANTE' ? (
              <div className="space-y-3">
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder={t('scholarships:applyMessage')}
                  className="w-full rounded-xl border border-border px-3 py-2"
                  rows={3}
                ></textarea>
                <button
                  onClick={candidatar}
                  className="rounded-xl bg-brand px-4 py-2 text-bg hover:bg-brand/90"
                >
                  {t('scholarships:applySend')}
                </button>
              </div>
            ) : user ? (
              <p className="text-muted">{t('scholarships:studentsOnly')}</p>
            ) : (
              <p className="text-muted">{t('scholarships:loginToApply')}</p>
            )}
          </div>
        )}
        {prazoPassado && <p className="mt-4 text-danger">{t('scholarships:expiredMessage')}</p>}
      </div>
    </div>
  )
}
