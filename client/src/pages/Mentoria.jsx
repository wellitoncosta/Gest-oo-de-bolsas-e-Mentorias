import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Star, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import AreaSelect from '../components/AreaSelect'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import Badge from '../components/ui/Badge'
import { formatarDataHora, fusoDoNavegador } from '../services/datas'
import { traduzirErro, traduzirEstado } from '../services/traduzirErro'
import Mentorias from './Mentorias'

const tabsByRole = {
  ESTUDANTE: [
    ['explorar', 'mentoring:explore'],
    ['sessoes', 'mentoring:mySessions'],
  ],
  MENTOR: [
    ['explorar', 'mentoring:explore'],
    ['sessoes', 'mentoring:mySessions'],
    ['horarios', 'mentoring:mySlots'],
    ['pedidos', 'mentoring:requests'],
  ],
  ADMIN: [
    ['explorar', 'mentoring:explore'],
    ['todas', 'mentoring:allSessions'],
  ],
}

function Pedidos() {
  const { t } = useTranslation(['mentoring', 'common'])
  const toast = useToast()
  const [items, setItems] = useState([])
  const carregar = useCallback(async () => {
    try {
      const res = await api.get('/mentorias/minhas')
      setItems(res.data.filter((item) => item.status === 'PENDENTE'))
    } catch (err) {
      toast.error(traduzirErro(err))
    }
  }, [toast])
  useEffect(() => {
    carregar()
  }, [carregar])
  useRealtime(['mentoria:nova', 'mentoria:estado'], carregar)
  const atualizar = async (id, status) => {
    try {
      await api.put(`/mentorias/${id}/estado`, { status })
      toast.success(
        t(status === 'CONFIRMADA' ? 'mentoring:requestAccepted' : 'mentoring:requestDeclined'),
      )
      carregar()
    } catch (err) {
      toast.error(traduzirErro(err))
    }
  }
  return items.length ? (
    <div className="grid gap-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="animate-fade-in rounded-2xl border border-border bg-surface p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{item.estudante.nome}</h2>
              <p className="text-sm text-muted">
                {item.tema} · {formatarDataHora(item.disponibilidade?.inicio)}
              </p>
            </div>
            <Badge>{traduzirEstado(item.status)}</Badge>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => atualizar(item.id, 'CONFIRMADA')}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg"
            >
              {t('mentoring:confirm')}
            </button>
            <button
              onClick={() => atualizar(item.id, 'RECUSADA')}
              className="rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white"
            >
              {t('mentoring:decline')}
            </button>
          </div>
        </article>
      ))}
    </div>
  ) : (
    <EmptyState title={t('mentoring:noPendingRequests')} />
  )
}

function TodasSessoes() {
  const { t, i18n } = useTranslation(['mentoring', 'common'])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api
      .get('/mentorias')
      .then((res) => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])
  if (loading) return <Skeleton className="h-48" />
  return items.length ? (
    <div className="grid gap-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="font-semibold">{item.tema}</h2>
              <p className="text-sm text-muted">
                {t('common:mentor')}: {item.mentor.nome} · {t('common:student')}:{' '}
                {item.estudante.nome}
              </p>
              <p className="text-sm text-muted">
                {formatarDataHora(item.disponibilidade?.inicio, i18n.language, fusoDoNavegador())}
              </p>
            </div>
            <Badge>{traduzirEstado(item.status)}</Badge>
          </div>
        </article>
      ))}
    </div>
  ) : (
    <EmptyState title={t('mentoring:noSessions')} />
  )
}

export default function Mentoria() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation(['mentoring', 'common'])
  const [params, setParams] = useSearchParams()
  const [mentores, setMentores] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('')
  const [pendingCount, setPendingCount] = useState(0)
  const availableTabs = useMemo(
    () => tabsByRole[user?.role] || [['explorar', 'mentoring:explore']],
    [user?.role],
  )
  const tab = params.get('tab') || availableTabs[0][0]
  useEffect(() => {
    if (!availableTabs.some(([value]) => value === tab))
      setParams({ tab: availableTabs[0][0] }, { replace: true })
  }, [availableTabs, tab, setParams])
  const carregar = useCallback(async () => {
    try {
      const [mentoresResult, disponibilidadesResult] = await Promise.allSettled([
        api.get('/mentorias/mentores'),
        api.get('/mentorias/disponibilidades'),
      ])
      if (mentoresResult.status === 'fulfilled') setMentores(mentoresResult.value.data)
      else console.error(mentoresResult.reason)
      if (disponibilidadesResult.status === 'fulfilled') setSlots(disponibilidadesResult.value.data)
      else {
        setSlots([])
        console.error(disponibilidadesResult.reason)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    carregar()
  }, [carregar])
  useRealtime(['disponibilidade:alterada', 'mentoria:nova', 'mentoria:estado'], carregar)
  const filtered = useMemo(
    () =>
      mentores.filter(
        (mentor) =>
          (!area || mentor.area === area) &&
          `${mentor.nome} ${mentor.area || ''}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()),
      ),
    [mentores, area, query],
  )
  const contarPedidos = useCallback(async () => {
    if (user?.role !== 'MENTOR') return
    try {
      const res = await api.get('/mentorias/minhas')
      setPendingCount(res.data.filter((item) => item.status === 'PENDENTE').length)
    } catch {
      setPendingCount(0)
    }
  }, [user?.role])
  useEffect(() => {
    contarPedidos()
  }, [contarPedidos])
  useRealtime(['mentoria:nova', 'mentoria:estado'], contarPedidos)
  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-5">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand dark:text-accent">
          B&M
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold">{t('mentoring:hubTitle')}</h1>
      </div>
      <nav
        aria-label={t('mentoring:sections')}
        className="mb-7 flex gap-2 overflow-x-auto border-b border-border pb-2"
      >
        {availableTabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setParams({ tab: value })}
            aria-current={tab === value ? 'page' : undefined}
            className={`relative whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${tab === value ? 'bg-brand/10 text-brand dark:text-accent' : 'text-muted hover:bg-surface hover:text-text'}`}
          >
            {t(label)}
            {value === 'pedidos' && pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-danger px-2 py-0.5 text-xs text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      {tab === 'explorar' && (
        <section>
          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <label className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3">
              <Search size={18} className="text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('mentoring:searchMentors')}
                aria-label={t('mentoring:searchMentors')}
                className="w-full bg-transparent py-3 outline-none"
              />
            </label>
            <div className="rounded-xl border border-border bg-surface px-3 py-2">
              <AreaSelect value={area} onChange={setArea} includeEmpty />
            </div>
            <span className="self-center text-sm text-muted">
              {t('mentoring:timezone')}: {user?.fusoHorario || fusoDoNavegador()}
            </span>
          </div>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filtered.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((mentor) => {
                const next = slots
                  .filter((slot) => slot.mentorId === mentor.id)
                  .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))[0]
                return (
                  <article
                    key={mentor.id}
                    className="animate-fade-in rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand dark:text-accent">
                        <UserRound size={22} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold">{mentor.nome}</h2>
                        {mentor.area && (
                          <AreaSelect
                            value={mentor.area}
                            disabled
                            className="appearance-none bg-transparent text-sm text-muted"
                          />
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Star size={15} className="text-amber-500" />
                        {mentor.avaliacaoMedia ? Number(mentor.avaliacaoMedia).toFixed(1) : '—'} (
                        {mentor.totalAvaliacoes || 0})
                      </span>
                      <span>
                        {t('mentoring:sessionCount', { count: mentor.totalSessoes || 0 })}
                      </span>
                    </div>
                    <p className="mt-3 min-h-10 text-sm text-muted">
                      {next
                        ? t('mentoring:nextAvailable', {
                            date: formatarDataHora(
                              next.inicio,
                              i18n.language,
                              user?.fusoHorario || fusoDoNavegador(),
                            ),
                          })
                        : t('mentoring:noAvailability')}
                    </p>
                    <Link
                      to={`/mentores/${mentor.id}`}
                      className="mt-3 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition hover:brightness-95"
                    >
                      {t('mentoring:book')}
                    </Link>
                  </article>
                )
              })}
            </div>
          ) : (
            <EmptyState title={t('mentoring:noneMentors')} />
          )}
          {!user && <p className="mt-5 text-sm text-muted">{t('mentoring:loginToBook')}</p>}
        </section>
      )}
      {tab === 'sessoes' && <Mentorias section="sessoes" />}
      {tab === 'horarios' && <Mentorias section="horarios" />}
      {tab === 'pedidos' && <Pedidos />}
      {tab === 'todas' && <TodasSessoes />}
    </div>
  )
}
