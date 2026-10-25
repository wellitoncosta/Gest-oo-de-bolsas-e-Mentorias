import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { traduzirErro } from '../services/traduzirErro'
import { formatarDataHora, formatarHora, fusoDoNavegador } from '../services/datas'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { CalendarDays, UserRound } from 'lucide-react'
import BackButton from '../components/BackButton'
import { useRealtime } from '../context/RealtimeContext'
import AreaSelect from '../components/AreaSelect'
import { conteudo, conteudoTemFallback } from '../services/conteudo'

export default function MentorDetalhe() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['mentoring', 'common'])
  const [mentor, setMentor] = useState(null)
  const [disps, setDisps] = useState([])
  const [tema, setTema] = useState('')
  const [sel, setSel] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    try {
      const [m, d] = await Promise.all([
        api.get(`/mentorias/mentores/${id}`),
        api.get(`/mentorias/disponibilidades?mentorId=${id}`),
      ])
      setMentor(m.data)
      setDisps(d.data)
      setSel((current) => (d.data.some((disp) => disp.id === current) ? current : ''))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => {
    carregar()
  }, [carregar])
  useRealtime(
    ['disponibilidade:alterada', 'mentoria:nova', 'mentoria:estado'],
    ({ evento, dados }) => {
      carregar()
      if (evento === 'disponibilidade:alterada' && (!dados.mentorId || dados.mentorId === id)) {
        setSucesso(t('mentoring:availabilityUpdated'))
      }
    },
  )

  const agendar = async () => {
    if (!user) {
      navigate('/login', {
        state: { from: { pathname: `/mentores/${id}` }, mensagem: t('mentoring:loginToBook') },
      })
      return
    }
    if (!sel || !tema) {
      setErro(t('mentoring:selectSlot'))
      return
    }
    setErro('')
    setSucesso('')
    try {
      await api.post('/mentorias/agendar', { disponibilidadeId: sel, tema })
      setSucesso(t('mentoring:requestSent'))
    } catch (err) {
      setErro(traduzirErro(err))
    }
  }

  if (loading)
    return (
      <div className="mx-auto grid max-w-4xl gap-4 px-5 py-12">
        <Skeleton className="h-40" />
        <Skeleton className="h-60" />
      </div>
    )
  if (!mentor)
    return (
      <div className="mx-auto max-w-4xl px-5 py-12">
        <EmptyState title={t('mentoring:notFound')} />
      </div>
    )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <BackButton to="/mentores" label={t('mentoring:backToMentors')} className="mb-3" />
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand dark:text-accent">
            <UserRound size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-bold mb-2">{mentor.nome}</h1>
            {mentor.area && (
              <AreaSelect
                value={mentor.area}
                disabled
                className="appearance-none bg-transparent text-sm text-muted"
              />
            )}
          </div>
        </div>
        {mentor.biografia && (
          <p className="text-text">{conteudo(mentor, 'biografia', i18n.language)}</p>
        )}
        {conteudoTemFallback(mentor, ['biografia'], i18n.language) && (
          <p className="mt-1 text-xs text-muted">{t('common:contentFallback')}</p>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <CalendarDays size={19} />
          {t('mentoring:availability')}
        </h2>
        {erro && <div className="mb-3 p-3 bg-danger/10 text-danger rounded">{erro}</div>}
        {sucesso && <div className="mb-3 p-3 bg-accent/10 text-accent rounded">{sucesso}</div>}
        {disps.length === 0 ? (
          <EmptyState title={t('mentoring:noAvailability')} />
        ) : (
          <div className="space-y-3">
            {disps.map((d) => (
              <label
                key={d.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 transition hover:border-brand"
              >
                <input
                  type="radio"
                  name="disp"
                  value={d.id}
                  onChange={(e) => setSel(e.target.value)}
                />
                <div>
                  <div className="font-medium">
                    {formatarDataHora(
                      d.inicio,
                      i18n.language,
                      user?.fusoHorario || fusoDoNavegador(),
                    )}{' '}
                    – {formatarHora(d.fim, i18n.language, user?.fusoHorario || fusoDoNavegador())}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
        {user?.role === 'ESTUDANTE' && disps.length > 0 && (
          <div className="mt-4 space-y-3">
            <input
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder={t('mentoring:topic')}
              className="w-full rounded-xl border border-border px-3 py-2"
            />
            <button
              onClick={agendar}
              className="rounded-xl bg-brand px-4 py-2 text-bg hover:bg-brand/90"
            >
              {t('mentoring:book')}
            </button>
          </div>
        )}
        {!user && disps.length > 0 && (
          <p className="mt-3 text-muted">{t('mentoring:loginToBook')}</p>
        )}
      </div>
    </div>
  )
}
