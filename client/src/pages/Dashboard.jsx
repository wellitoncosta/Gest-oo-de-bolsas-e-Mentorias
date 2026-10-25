import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Plus,
  Star,
  UsersRound,
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import { useToast } from '../context/ToastContext'
import Skeleton from '../components/ui/Skeleton'
import KpiCard from '../components/ui/KpiCard'
import Badge from '../components/ui/Badge'
import BaseEmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import { conteudo } from '../services/conteudo'
import { traduzirEstado } from '../services/traduzirErro'

const DashboardCharts = lazy(() => import('./DashboardCharts'))
function EmptyState(props) {
  return <BaseEmptyState {...props} compact />
}

function Painel({ title, to, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {to && (
          <Link
            to={to}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline dark:text-accent"
          >
            {action}
            <ArrowRight size={15} />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function SkeletonDashboard() {
  return (
    <div className="mx-auto max-w-content space-y-6 px-5 py-8">
      <Skeleton className="h-48 rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-32" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-64" />
        ))}
      </div>
    </div>
  )
}

function dataFormatada(
  value,
  language,
  timeZone,
  options = { dateStyle: 'medium', timeStyle: 'short' },
) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat(language?.startsWith('en') ? 'en-GB' : 'pt-PT', {
      ...options,
      timeZone,
    }).format(new Date(value))
  } catch {
    return new Intl.DateTimeFormat(language?.startsWith('en') ? 'en-GB' : 'pt-PT', options).format(
      new Date(value),
    )
  }
}

function areaNome(area, i18n) {
  return area ? i18n.t(`areas:${area}`) : ''
}

function horaAtual(timeZone) {
  try {
    return Number(
      new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(
        new Date(),
      ),
    )
  } catch {
    return Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Luanda',
        hour: '2-digit',
        hourCycle: 'h23',
      }).format(new Date()),
    )
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation(['dashboard', 'common', 'nav', 'status', 'areas'])
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState([])
  const refreshTimer = useRef(null)
  const role = user?.role || 'VISITANTE'
  const zone = user?.fusoHorario || 'Africa/Luanda'
  const load = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/resumo')
      setData(response.data)
      if (response.data.admin?.atividadeRecente) setActivity(response.data.admin.atividadeRecente)
    } catch (error) {
      console.error(error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    load()
    return () => window.clearTimeout(refreshTimer.current)
  }, [load, user?.id])
  useRealtime(
    [
      'estatisticas:alteradas',
      'bolsa:criada',
      'bolsa:atualizada',
      'bolsa:removida',
      'candidatura:nova',
      'candidatura:estado',
      'mentoria:nova',
      'mentoria:estado',
      'disponibilidade:alterada',
    ],
    ({ evento, dados }) => {
      const tiposAoVivo = {
        'bolsa:criada': 'bolsa',
        'bolsa:atualizada': 'bolsaAtualizada',
        'candidatura:nova': 'candidatura',
        'candidatura:estado': 'candidaturaAtualizada',
        'mentoria:nova': 'mentoria',
        'mentoria:estado': 'mentoriaAtualizada',
      }
      if (role === 'ADMIN' && tiposAoVivo[evento]) {
        const tipo = tiposAoVivo[evento]
        setActivity((items) =>
          [
            {
              id: `live-${Date.now()}`,
              tipo,
              titulo: dados?.titulo || dados?.tituloEn || '',
              status: dados?.status,
              data: new Date().toISOString(),
              aoVivo: true,
            },
            ...items,
          ].slice(0, 10),
        )
      }
      window.clearTimeout(refreshTimer.current)
      refreshTimer.current = window.setTimeout(load, 350)
    },
  )

  if (loading) return <SkeletonDashboard />
  if (!data)
    return (
      <div className="mx-auto max-w-content px-5 py-12">
        <EmptyState
          title={t('loadError')}
          action={
            <Button
              onClick={() => {
                setLoading(true)
                load()
              }}
            >
              {t('retry')}
            </Button>
          }
        />
      </div>
    )

  const publico = data.publico || { totais: {}, variacoes: {}, bolsasPublicadasPorMes: [] }
  const variacao = (metric, currentMetric = metric) => {
    const source =
      data.admin?.variacoes?.[metric] ||
      data.estudante?.variacoes?.[metric] ||
      data.mentor?.variacoes?.[metric] ||
      publico.variacoes?.[currentMetric]
    const delta = source?.diferenca > 0 ? `+${source.diferenca}` : String(source?.diferenca ?? 0)
    return source
      ? {
          diferenca: source.diferenca,
          atual: source.atual,
          anterior: source.anterior,
          texto: t('variation30', { count: source.atual, delta }),
        }
      : null
  }
  const hour = horaAtual(zone)
  const greetingKey = hour < 12 ? 'goodMorning' : hour < 18 ? 'goodAfternoon' : 'goodEvening'
  const titulo = t(`${greetingKey}`, { name: user?.nome?.split(' ')[0] || t('there') })
  const dataHoje = dataFormatada(new Date(), i18n.language, zone, { dateStyle: 'full' })
  const chartFallback = <Skeleton className="h-72" />

  const header = (ctaTo, ctaLabel, icon = ArrowRight) => {
    const CtaIcon = icon
    return (
      <section className="relative overflow-hidden rounded-3xl bg-brand px-6 py-7 text-bg shadow-lg shadow-brand/15 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-bg/75">{dataHoje}</p>
            <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{titulo}</h1>
            <p className="mt-2 text-sm text-bg/70">{t('timezone', { zone })}</p>
          </div>
          <Link
            to={ctaTo}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 font-semibold text-bg transition hover:-translate-y-0.5 hover:brightness-95"
          >
            <CtaIcon size={18} />
            {ctaLabel}
          </Link>
        </div>
      </section>
    )
  }

  const renderKpis = (items, spark = []) => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <KpiCard
          key={item.label}
          label={item.label}
          value={item.value}
          icon={item.icon}
          change={item.change}
          sparkline={
            item.sparkline ||
            (item.change?.atual !== undefined ? [item.change.anterior, item.change.atual] : spark)
          }
          suffix={item.suffix}
          decimals={item.decimals}
        />
      ))}
    </div>
  )

  const bolsaLista = (items, emptyKey, link, linkLabel) =>
    items?.length ? (
      <ul className="divide-y divide-border">
        {items.map((bolsa) => (
          <li
            key={bolsa.id}
            className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <Link
                to={`/bolsas/${bolsa.id}`}
                className="font-medium text-text hover:text-brand dark:hover:text-accent"
              >
                {conteudo(bolsa, 'titulo', i18n.language)}
              </Link>
              <p className="mt-1 text-xs text-muted">
                {areaNome(bolsa.area, i18n)}
                {bolsa.dataLimite
                  ? ` · ${t('deadline')} ${dataFormatada(bolsa.dataLimite, i18n.language, zone, { dateStyle: 'medium' })}`
                  : ''}
              </p>
            </div>
            <Badge tone="brand">{bolsa.recomendacao === 'RECENTE' ? t('recent') : t('open')}</Badge>
          </li>
        ))}
      </ul>
    ) : (
      <EmptyState
        title={t(emptyKey)}
        action={
          <Link
            className="text-sm font-semibold text-brand hover:underline dark:hover:text-accent"
            to={link}
          >
            {linkLabel}
          </Link>
        }
      />
    )

  const dashboardVisitante = () => {
    const totals = publico.totais
    const points = publico.bolsasPublicadasPorMes.map((item) => item.total)
    return (
      <div className="mx-auto max-w-content space-y-6 px-5 py-8">
        {header('/registo', t('createAccount'), Plus)}
        {renderKpis(
          [
            {
              label: t('publicScholarships'),
              value: totals.bolsasAbertas || 0,
              icon: GraduationCap,
              change: variacao('bolsasAbertas'),
            },
            {
              label: t('publicMentors'),
              value: totals.mentores || 0,
              icon: UsersRound,
              change: variacao('mentores'),
            },
            {
              label: t('publicSessions'),
              value: totals.mentoriasRealizadas || 0,
              icon: BookOpenCheck,
              change: variacao('mentoriasRealizadas'),
            },
            {
              label: t('publicStudents'),
              value: totals.estudantes || 0,
              icon: BriefcaseBusiness,
              change: variacao('estudantes'),
            },
          ],
          points,
        )}
        <div className="grid gap-5 lg:grid-cols-12">
          <Painel title={t('publicChartTitle')} className="lg:col-span-8">
            <Suspense fallback={chartFallback}>
              <DashboardCharts mode="public" data={publico} />
            </Suspense>
          </Painel>
          <Painel
            title={t('publicNextTitle')}
            className="flex flex-col justify-between lg:col-span-4"
          >
            <p className="leading-7 text-muted">{t('publicNextText')}</p>
            <Link
              to="/registo"
              className="mt-5 inline-flex items-center gap-2 font-semibold text-brand dark:text-accent"
            >
              {t('createAccount')}
              <ArrowRight size={16} />
            </Link>
          </Painel>
        </div>
      </div>
    )
  }

  const dashboardEstudante = () => {
    const student = data.estudante || {}
    const steps = ['profile', 'application', 'approval', 'mentoring']
    const stepValues = [
      student.etapas?.perfil,
      student.etapas?.candidatura,
      student.etapas?.aprovacao,
      student.etapas?.mentoria,
    ]
    const proxima = student.proximaSessao
    const linkReuniao = proxima?.linkReuniao
    return (
      <div className="mx-auto max-w-content space-y-6 px-5 py-8">
        {header('/bolsas', t('exploreScholarships'), GraduationCap)}
        {!student.area && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
            <span>{t('completeAreaPrompt')}</span>
            <Link to="/minha-conta" className="font-semibold text-brand dark:text-accent">
              {t('completeProfile')}
            </Link>
          </div>
        )}
        {renderKpis(
          [
            {
              label: t('activeApplications'),
              value: student.candidaturasAtivas || 0,
              icon: FileText,
              change: variacao('candidaturasAtivas'),
            },
            {
              label: t('approvedApplications'),
              value: student.candidaturasAprovadas || 0,
              icon: CheckCircle2,
              change: variacao('candidaturasAprovadas'),
            },
            { label: t('sessionsWeek'), value: student.sessaoSemana || 0, icon: CalendarCheck2 },
            {
              label: t('profileCompletion'),
              value: student.completudePerfil || 0,
              icon: Award,
              suffix: '%',
            },
          ],
          [0, student.candidaturas?.length || 0],
        )}
        <div className="grid gap-5 lg:grid-cols-12">
          <Painel title={t('journeyTitle')} className="lg:col-span-12">
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <li
                  key={step}
                  className={`flex items-center gap-3 rounded-xl border p-4 ${stepValues[index] ? 'border-accent/30 bg-accent/5' : 'border-border bg-bg/40'}`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${stepValues[index] ? 'bg-accent text-bg' : 'bg-surface-2 text-muted'}`}
                  >
                    {stepValues[index] ? <Check size={17} /> : <span>{index + 1}</span>}
                  </span>
                  <div>
                    <p className="font-medium">{t(`step_${step}`)}</p>
                    <p className="text-xs text-muted">
                      {stepValues[index] ? t('stepComplete') : t('stepPending')}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-xl bg-brand/5 px-4 py-3 text-sm text-muted">
              {t('nextStep', {
                step: t(`step_${steps[stepValues.findIndex((done) => !done)] || 'mentoring'}`),
              })}
            </p>
          </Painel>
          <Painel
            title={t('nextSessionTitle')}
            to="/mentorias"
            action={t('viewAll')}
            className="lg:col-span-5"
          >
            {proxima ? (
              <div className="space-y-3">
                <p className="font-semibold">
                  {dataFormatada(proxima.disponibilidade?.inicio, i18n.language, zone)}
                </p>
                <p className="text-sm text-muted">
                  {t('withMentor', { name: proxima.mentor?.nome })}
                </p>
                <Badge tone="success">{t('confirmed')}</Badge>
                {linkReuniao && (
                  <a className="block" href={linkReuniao} target="_blank" rel="noreferrer">
                    <Button className="mt-2">{t('joinMeeting')}</Button>
                  </a>
                )}
              </div>
            ) : (
              <EmptyState
                title={t('noNextSession')}
                action={
                  <Link
                    className="text-sm font-semibold text-brand dark:text-accent"
                    to="/mentores"
                  >
                    {t('findMentor')}
                  </Link>
                }
              />
            )}
          </Painel>
          <Painel
            title={student.prazosFallback ? t('nextDeadlines') : t('closingDeadlines')}
            to="/bolsas"
            action={t('viewAll')}
            className="lg:col-span-7"
          >
            {student.prazos?.length ? (
              <ul className="divide-y divide-border">
                {student.prazos.map((item) => {
                  const days = Math.max(
                    0,
                    Math.ceil((new Date(item.dataLimite) - Date.now()) / 86400000),
                  )
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0"
                    >
                      <Link
                        to={`/bolsas/${item.id}`}
                        className="min-w-0 truncate font-medium hover:text-brand dark:hover:text-accent"
                      >
                        {conteudo(item, 'titulo', i18n.language)}
                      </Link>
                      <Badge tone={days <= 3 ? 'danger' : 'brand'}>
                        {t('daysLeft', { count: days })}
                      </Badge>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState title={t('noDeadlines')} />
            )}
          </Painel>
          <Painel
            title={t('recommendedScholarships')}
            to="/bolsas"
            action={t('viewAll')}
            className="lg:col-span-6"
          >
            {bolsaLista(
              student.bolsasRecomendadas,
              'noRecommendedScholarships',
              '/bolsas',
              t('exploreScholarships'),
            )}
          </Painel>
          <Painel
            title={t('suggestedMentors')}
            to="/mentores"
            action={t('viewAll')}
            className="lg:col-span-6"
          >
            {student.mentoresSugeridos?.length ? (
              <ul className="divide-y divide-border">
                {student.mentoresSugeridos.map((mentor) => (
                  <li
                    key={mentor.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0"
                  >
                    <div>
                      <p className="font-medium">{mentor.nome}</p>
                      <p className="text-xs text-muted">
                        {areaNome(mentor.area, i18n)}
                        {mentor.temHorarioLivre ? ` · ${t('hasOpenSlot')}` : ''}
                      </p>
                    </div>
                    <Link
                      to={`/mentores/${mentor.id}`}
                      className="text-sm font-semibold text-brand dark:text-accent"
                    >
                      {t('viewProfile')}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title={t('noSuggestedMentors')}
                action={
                  <Link
                    className="text-sm font-semibold text-brand dark:text-accent"
                    to="/mentores"
                  >
                    {t('findMentor')}
                  </Link>
                }
              />
            )}
          </Painel>
          <Painel
            title={t('myApplications')}
            to="/candidaturas"
            action={t('viewAll')}
            className="lg:col-span-12"
          >
            {student.candidaturas?.length ? (
              <ul className="grid gap-3 md:grid-cols-2">
                {student.candidaturas.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {conteudo(item.bolsa, 'titulo', i18n.language)}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {dataFormatada(item.createdAt, i18n.language, zone, {
                          dateStyle: 'medium',
                        })}
                      </p>
                    </div>
                    <Badge
                      tone={
                        item.status === 'APROVADA'
                          ? 'success'
                          : item.status === 'REJEITADA'
                            ? 'danger'
                            : 'brand'
                      }
                    >
                      {traduzirEstado(item.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title={t('noApplications')}
                action={
                  <Link className="text-sm font-semibold text-brand dark:text-accent" to="/bolsas">
                    {t('exploreScholarships')}
                  </Link>
                }
              />
            )}
          </Painel>
        </div>
      </div>
    )
  }

  const dashboardMentor = () => {
    const mentor = data.mentor || {}
    return (
      <div className="mx-auto max-w-content space-y-6 px-5 py-8">
        {header('/mentorias', t('manageAvailability'), CalendarClock)}
        {renderKpis(
          [
            {
              label: t('pendingRequests'),
              value: mentor.pedidosPendentes || 0,
              icon: Clock3,
              change: variacao('pedidosPendentes'),
            },
            { label: t('sessionsWeek'), value: mentor.sessoesSemana || 0, icon: CalendarCheck2 },
            {
              label: t('hoursThisMonth'),
              value: mentor.horasRealizadasMes || 0,
              icon: BookOpenCheck,
              decimals: 1,
            },
            {
              label: t('averageRating'),
              value: mentor.avaliacaoMedia || 0,
              icon: Star,
              decimals: 1,
              change: {
                diferenca: 0,
                texto: t('ratingCount', { count: mentor.totalAvaliacoes || 0 }),
              },
            },
          ],
          mentor.horasPorSemana?.map((item) => item.horas),
        )}
        <div className="grid gap-5 lg:grid-cols-12">
          <Painel
            title={t('weekAgenda')}
            to="/mentorias"
            action={t('manageAvailability')}
            className="lg:col-span-7"
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
              {(mentor.agendaSemana || []).map((day) => (
                <div key={day.data} className="min-h-24 rounded-xl bg-bg/60 p-3">
                  <p className="text-xs font-semibold text-muted">
                    {dataFormatada(day.data, i18n.language, zone, {
                      weekday: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="mt-3 text-2xl font-semibold">{day.sessoes.length}</p>
                  <p className="text-xs text-muted">{t('sessionsLabel')}</p>
                </div>
              ))}
            </div>
          </Painel>
          <Painel title={t('weeklyHours')} className="lg:col-span-5">
            <Suspense fallback={chartFallback}>
              <DashboardCharts mode="mentor" data={mentor} />
            </Suspense>
          </Painel>
          <Painel
            title={t('pendingRequests')}
            to="/mentorias"
            action={t('viewAll')}
            className="lg:col-span-7"
          >
            {mentor.proximas?.some((item) => item.status === 'PENDENTE') ? (
              <ul className="space-y-3">
                {mentor.proximas
                  .filter((item) => item.status === 'PENDENTE')
                  .map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                    >
                      <div>
                        <p className="font-medium">{item.estudante?.nome}</p>
                        <p className="mt-1 text-sm text-muted">
                          {item.tema} ·{' '}
                          {dataFormatada(item.disponibilidade?.inicio, i18n.language, zone)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            try {
                              await api.put(`/mentorias/${item.id}/estado`, {
                                status: 'CONFIRMADA',
                              })
                              toast.success(t('requestAccepted'))
                              load()
                            } catch {
                              toast.error(t('actionFailed'))
                            }
                          }}
                        >
                          {t('accept')}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            try {
                              await api.put(`/mentorias/${item.id}/estado`, { status: 'RECUSADA' })
                              toast.success(t('requestDeclined'))
                              load()
                            } catch {
                              toast.error(t('actionFailed'))
                            }
                          }}
                        >
                          {t('decline')}
                        </Button>
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <EmptyState
                title={t('noPendingRequests')}
                action={
                  <Link
                    className="text-sm font-semibold text-brand dark:text-accent"
                    to="/mentorias"
                  >
                    {t('manageAvailability')}
                  </Link>
                }
              />
            )}
          </Painel>
          <Painel
            title={t('upcomingSessions')}
            to="/mentorias"
            action={t('viewAll')}
            className="lg:col-span-5"
          >
            {mentor.proximas?.length ? (
              <ul className="divide-y divide-border">
                {mentor.proximas.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 py-3 first:pt-0"
                  >
                    <div>
                      <p className="font-medium">{item.estudante?.nome}</p>
                      <p className="text-xs text-muted">
                        {dataFormatada(item.disponibilidade?.inicio, i18n.language, zone)}
                      </p>
                    </div>
                    <Badge tone={item.status === 'CONFIRMADA' ? 'success' : 'brand'}>
                      {traduzirEstado(item.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t('noUpcomingSessions')} />
            )}
          </Painel>
          <Painel title={t('occupancyRate')} className="lg:col-span-12">
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-4xl font-semibold tabular-nums">{mentor.ocupacaoHorarios || 0}%</p>
              <p className="pb-1 text-sm text-muted">
                {t('slotsBooked', {
                  booked: Math.round(
                    ((mentor.ocupacaoHorarios || 0) * (mentor.totalHorariosPublicados || 0)) / 100,
                  ),
                  total: mentor.totalHorariosPublicados || 0,
                })}
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-bg">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${mentor.ocupacaoHorarios || 0}%` }}
              />
            </div>
          </Painel>
          <Painel title={t('averageRating')} className="lg:col-span-12">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex text-accent" aria-label={`${mentor.avaliacaoMedia || 0} / 5`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    size={22}
                    fill={index < Math.round(mentor.avaliacaoMedia || 0) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <span className="font-semibold">
                {Number(mentor.avaliacaoMedia || 0).toFixed(1)} / 5
              </span>
              <span className="text-sm text-muted">
                {t('outOfFive', { count: mentor.totalAvaliacoes || 0 })}
              </span>
            </div>
          </Painel>
        </div>
      </div>
    )
  }

  const dashboardAdmin = () => {
    const admin = data.admin || {}
    const totals = admin.totais || {}
    return (
      <div className="mx-auto max-w-content space-y-6 px-5 py-8">
        {header('/admin', t('newScholarship'), Plus)}
        {renderKpis(
          [
            {
              label: t('usersTotal'),
              value: totals.utilizadores || 0,
              icon: UsersRound,
              change: variacao('utilizadores'),
            },
            {
              label: t('openScholarships'),
              value: totals.bolsasAbertas || 0,
              icon: GraduationCap,
              change: variacao('bolsas'),
            },
            {
              label: t('applicationsTotal'),
              value: totals.candidaturas || 0,
              icon: FileText,
              change: variacao('candidaturas'),
            },
            {
              label: t('mentoringTotal'),
              value: totals.mentorias || 0,
              icon: BookOpenCheck,
              change: variacao('mentorias'),
            },
          ],
          admin.candidaturasPorMes?.map((item) => item.total),
        )}
        <Suspense
          fallback={
            <div className="grid gap-5 lg:grid-cols-2">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
              <Skeleton className="h-72 lg:col-span-2" />
            </div>
          }
        >
          <DashboardCharts mode="admin" data={admin} />
        </Suspense>
        <div className="grid gap-5 lg:grid-cols-12">
          <Painel
            title={t('topScholarships')}
            to="/admin"
            action={t('viewAll')}
            className="lg:col-span-7"
          >
            {admin.topBolsas?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="pb-3 font-medium">{t('scholarship')}</th>
                      <th className="pb-3 font-medium">{t('area')}</th>
                      <th className="pb-3 text-right font-medium">{t('applications')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.topBolsas.map((item) => (
                      <tr key={item.id} className="border-b border-border/60 last:border-0">
                        <td className="py-3 font-medium">
                          {conteudo(item, 'titulo', i18n.language)}
                        </td>
                        <td className="py-3 text-muted">{areaNome(item.area, i18n)}</td>
                        <td className="py-3 text-right tabular-nums">{item.candidaturas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title={t('noScholarships')} />
            )}
          </Painel>
          <Painel
            title={t('staleApplications')}
            to="/admin/candidaturas"
            action={t('viewAll')}
            className="lg:col-span-5"
          >
            {admin.candidaturasParadas?.length ? (
              <ul className="divide-y divide-border">
                {admin.candidaturasParadas.slice(0, 5).map((item) => (
                  <li key={item.id} className="py-3 first:pt-0">
                    <p className="font-medium">{item.user.nome}</p>
                    <p className="text-sm text-muted">
                      {conteudo(item.bolsa, 'titulo', i18n.language)}
                    </p>
                    <p className="mt-1 text-xs text-danger">
                      {t('waitingSince', {
                        date: dataFormatada(item.createdAt, i18n.language, zone, {
                          dateStyle: 'medium',
                        }),
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t('noStaleApplications')} />
            )}
          </Painel>
          <Painel
            title={admin.prazosFallback ? t('nextDeadlines') : t('deadlinesSoon')}
            to="/bolsas"
            action={t('viewAll')}
            className="lg:col-span-5"
          >
            {bolsaLista(admin.bolsasPrazo, 'noDeadlines', '/bolsas', t('viewAll'))}
          </Painel>
          <Painel
            title={t('activeMentors')}
            to="/admin/utilizadores"
            action={t('viewAll')}
            className="lg:col-span-7"
          >
            {admin.mentoresAtivos?.length ? (
              <ol className="space-y-3">
                {admin.mentoresAtivos.map((mentor, index) => (
                  <li key={mentor.id} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-sm font-semibold text-brand dark:text-accent">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{mentor.nome}</p>
                      <p className="text-xs text-muted">{areaNome(mentor.area, i18n)}</p>
                    </div>
                    <Badge>
                      {t('completedSessionsCount', { count: mentor.sessoesConcluidas })}
                    </Badge>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title={t('noMentors')} />
            )}
          </Painel>
          <Painel title={t('liveActivity')} className="lg:col-span-12">
            {activity.length ? (
              <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {activity.map((item) => (
                  <li
                    key={item.id}
                    className={`flex items-start gap-3 rounded-xl bg-bg/50 p-4 ${item.aoVivo ? 'animate-fade-in ring-1 ring-accent/30' : ''}`}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand dark:text-accent">
                      <Activity size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">
                        {t(`activity_${item.tipo}${item.aoVivo ? 'Live' : ''}`, {
                          name: item.nome || '',
                          title: conteudo(item, 'titulo', i18n.language),
                          mentor: item.mentor || '',
                          status: item.status ? t(`status:${item.status}`) : '',
                        })}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {dataFormatada(item.data, i18n.language, zone)}
                      </p>
                    </div>
                    {item.aoVivo && <Badge tone="success">{t('live')}</Badge>}
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title={t('noActivity')} />
            )}
          </Painel>
        </div>
      </div>
    )
  }

  if (role === 'ESTUDANTE') return dashboardEstudante()
  if (role === 'MENTOR') return dashboardMentor()
  if (role === 'ADMIN') return dashboardAdmin()
  return dashboardVisitante()
}
