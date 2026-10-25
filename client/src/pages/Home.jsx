import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  GraduationCap,
  UsersRound,
} from 'lucide-react'
import api from '../services/api'
import Card from '../components/ui/Card'
import KpiCard from '../components/ui/KpiCard'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { useRealtime } from '../context/RealtimeContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import AreaSelect from '../components/AreaSelect'
import { conteudo, conteudoTemFallback, formatarValor } from '../services/conteudo'

function Reveal({ children, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const node = ref.current
    if (!node || !('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [className])
  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}
    >
      {children}
    </div>
  )
}

const initials = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

export default function Home() {
  const { t, i18n } = useTranslation(['home', 'common', 'scholarships', 'mentoring', 'status'])
  const toast = useToast()
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [scholarships, setScholarships] = useState([])
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [faqOpen, setFaqOpen] = useState(0)
  const carregar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setLoading(true)
    await Promise.allSettled([
      api.get('/dashboard/estatisticas'),
      api.get('/bolsas'),
      api.get('/mentorias/mentores'),
    ])
      .then((results) => {
        if (results[0].status === 'fulfilled') setStats(results[0].value.data)
        if (results[1].status === 'fulfilled')
          setScholarships(
            results[1].value.data.filter((item) => item.status === 'ABERTA').slice(0, 3),
          )
        if (results[2].status === 'fulfilled') setMentors(results[2].value.data.slice(0, 3))
      })
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    carregar()
  }, [carregar])
  useRealtime(
    ['bolsa:criada', 'bolsa:atualizada', 'bolsa:removida', 'estatisticas:alteradas'],
    ({ evento, dados }) => {
      if (evento === 'bolsa:criada' && user?.role === 'ESTUDANTE') {
        toast.successLink(
          t('scholarships:newScholarship', { title: conteudo(dados, 'titulo', i18n.language) }),
          `/bolsas/${dados.id}`,
        )
      }
      carregar({ silencioso: true })
    },
  )
  const applications =
    stats.candidaturasPorEstado?.reduce((sum, item) => sum + item._count.status, 0) || 0
  const steps = ['discover', 'apply', 'mentor']
  const audiences = ['scholar', 'mentor', 'manager']
  const faqs = ['faq1', 'faq2', 'faq3', 'faq4', 'faq5']
  return (
    <div>
      <section className="hero-pattern relative isolate overflow-hidden bg-bg">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_rgb(var(--accent)_/_0.14),_transparent_42%),linear-gradient(135deg,rgb(var(--brand)_/_0.06),transparent_60%)]" />
        <div className="mx-auto grid max-w-content items-center gap-14 px-5 py-20 sm:py-28 lg:grid-cols-[1.1fr_.9fr]">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3.5 py-2 text-sm font-semibold text-brand dark:text-accent">
              <BookOpenCheck size={16} />
              {t('eyebrow')}
            </div>
            <h1 className="text-5xl font-semibold leading-[1.04] text-text sm:text-6xl lg:text-7xl">
              {t('title')}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted sm:text-xl">{t('subtitle')}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/bolsas"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3.5 font-semibold text-bg shadow-lg shadow-brand/15 transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                {t('browseScholarships')}
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/mentores"
                className="rounded-xl border border-border bg-surface px-5 py-3.5 font-semibold text-text transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                {t('meetMentors')}
              </Link>
            </div>
          </div>
          <div
            className="relative mx-auto min-h-[350px] w-full max-w-lg sm:min-h-[410px]"
            aria-label={t('compositionAlt')}
          >
            <div className="absolute left-[8%] top-[8%] w-[75%] animate-float rounded-3xl border border-border bg-surface p-6 shadow-xl shadow-brand/10">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-muted">
                  <Award size={16} className="text-accent" />
                  {t('scholarshipCard')}
                </span>
                <Badge tone="success">{t('openLabel')}</Badge>
              </div>
              <h2 className="mt-5 font-display text-2xl text-text">{t('visualScholarship')}</h2>
              <p className="mt-2 text-sm text-muted">{t('visualArea')}</p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="font-semibold text-brand dark:text-accent">
                  {t('visualAmount')}
                </span>
                <span className="text-xs text-muted">{t('visualDeadline')}</span>
              </div>
            </div>
            <div className="absolute bottom-[7%] right-[1%] w-[72%] animate-float-delayed rounded-3xl border border-border bg-surface p-5 shadow-xl shadow-brand/10">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-muted">
                <CalendarDays size={16} className="text-brand" />
                {t('sessionCard')}
              </span>
              <div className="mt-4 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-sm font-bold text-bg">
                  AM
                </span>
                <div>
                  <h3 className="font-semibold text-text">{t('visualMentor')}</h3>
                  <p className="text-sm text-muted">{t('visualDate')}</p>
                </div>
                <span className="ml-auto rounded-lg bg-accent/10 px-2.5 py-1.5 text-sm font-semibold text-accent">
                  10:30
                </span>
              </div>
            </div>
            <div className="absolute right-[2%] top-[0%] animate-float-slow rounded-2xl border border-border bg-surface px-4 py-3 shadow-lg">
              <p className="text-xs text-muted">{t('impactCard')}</p>
              <p className="mt-1 text-2xl font-bold text-brand dark:text-accent">+24%</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/70">
        <Reveal className="mx-auto max-w-content px-5 py-14">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-[.14em] text-accent">B&amp;M</p>
            <h2 className="mt-2 text-3xl font-semibold text-text">{t('numbers')}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label={t('openScholarships')}
              value={stats.bolsasAbertas || 0}
              icon={GraduationCap}
            />
            <KpiCard label={t('mentors')} value={stats.totalMentores || 0} icon={UsersRound} />
            <KpiCard
              label={t('sessions')}
              value={stats.mentoriasAgendadas || 0}
              icon={BookOpenCheck}
            />
            <KpiCard label={t('applications')} value={applications} icon={Compass} />
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-content px-5 py-20">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[.14em] text-accent">
            {t('stepsEyebrow')}
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-text sm:text-4xl">{t('stepsTitle')}</h2>
          <div className="relative mt-10 grid gap-5 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-brand/20 md:block" />
            {steps.map((step, index) => (
              <Card key={step} className="relative">
                <span className="relative z-10 grid h-16 w-16 place-items-center rounded-2xl border-4 border-bg bg-brand text-xl font-bold text-bg">
                  0{index + 1}
                </span>
                <h3 className="mt-5 text-xl font-semibold">{t(`step${index + 1}Title`)}</h3>
                <p className="mt-2 leading-7 text-muted">{t(`step${index + 1}Text`)}</p>
              </Card>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="border-y border-border bg-surface/60">
        <div className="mx-auto max-w-content px-5 py-20">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[.14em] text-accent">
                  {t('featuredEyebrow')}
                </p>
                <h2 className="mt-2 text-3xl font-semibold">{t('featuredTitle')}</h2>
              </div>
              <Link
                className="inline-flex items-center gap-2 font-semibold text-brand dark:text-accent"
                to="/bolsas"
              >
                {t('seeAll')}
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {loading ? (
                [1, 2, 3].map((item) => <Skeleton key={item} className="h-64" />)
              ) : scholarships.length ? (
                scholarships.map((item) => (
                  <Card key={item.id} className="group flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="success">{t('openLabel')}</Badge>
                      <AreaSelect
                        value={item.area}
                        disabled
                        className="appearance-none bg-transparent text-sm text-muted"
                      />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold group-hover:text-brand dark:group-hover:text-accent">
                      {conteudo(item, 'titulo', i18n.language)}
                    </h3>
                    {conteudoTemFallback(item, ['titulo', 'valor'], i18n.language) && (
                      <p className="mt-1 text-xs text-muted">{i18n.t('common:contentFallback')}</p>
                    )}
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                      {item.entidade}
                    </p>
                    <div className="mt-auto flex flex-wrap justify-between gap-2 border-t border-border pt-4">
                      <span className="font-semibold text-brand dark:text-accent">
                        {formatarValor(conteudo(item, 'valor', i18n.language), i18n.language) ||
                          t('valueOnDetails')}
                      </span>
                      <span className="text-sm text-muted">
                        {t('deadline')}:{' '}
                        {new Intl.DateTimeFormat(
                          i18n.language?.startsWith('en') ? 'en-GB' : 'pt-PT',
                        ).format(new Date(item.dataLimite))}
                      </span>
                    </div>
                    <Link
                      className="mt-4 inline-flex items-center gap-2 font-semibold text-brand dark:text-accent"
                      to={`/bolsas/${item.id}`}
                    >
                      {t('viewScholarship')}
                      <ArrowRight size={16} />
                    </Link>
                  </Card>
                ))
              ) : (
                <EmptyState title={t('noFeaturedScholarships')} />
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-content px-5 py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.14em] text-accent">
                {t('mentorsEyebrow')}
              </p>
              <h2 className="mt-2 text-3xl font-semibold">{t('mentorsTitle')}</h2>
            </div>
            <Link
              className="inline-flex items-center gap-2 font-semibold text-brand dark:text-accent"
              to="/mentores"
            >
              {t('seeAll')}
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {loading ? (
              [1, 2, 3].map((item) => <Skeleton key={item} className="h-56" />)
            ) : mentors.length ? (
              mentors.map((mentor) => (
                <Card key={mentor.id} className="group">
                  <div className="flex items-center gap-4">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-lg font-bold text-brand dark:text-accent">
                      {initials(mentor.nome)}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold">{mentor.nome}</h3>
                      <AreaSelect
                        value={mentor.area}
                        disabled
                        className="appearance-none bg-transparent text-sm text-muted"
                      />
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">
                    {conteudo(mentor, 'biografia', i18n.language)}
                  </p>
                  {conteudoTemFallback(mentor, ['biografia'], i18n.language) && (
                    <p className="mt-1 text-xs text-muted">{i18n.t('common:contentFallback')}</p>
                  )}
                  <Link
                    className="mt-5 inline-flex items-center gap-2 font-semibold text-brand dark:text-accent"
                    to={`/mentores/${mentor.id}`}
                  >
                    {t('viewMentor')}
                    <ArrowRight size={16} />
                  </Link>
                </Card>
              ))
            ) : (
              <EmptyState title={t('noFeaturedMentors')} />
            )}
          </div>
        </Reveal>
      </section>

      <section className="border-y border-border bg-surface/60">
        <div className="mx-auto max-w-content px-5 py-20">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-[.14em] text-accent">
              {t('audienceEyebrow')}
            </p>
            <h2 className="mt-2 text-3xl font-semibold">{t('audienceTitle')}</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {audiences.map((audience, index) => {
                const Icon = [GraduationCap, UsersRound, BriefcaseBusiness][index]
                const dest = ['/registo', '/registo', '/login'][index]
                return (
                  <Card key={audience}>
                    <Icon className="text-accent" size={26} />
                    <h3 className="mt-4 text-xl font-semibold">{t(`${audience}Title`)}</h3>
                    <p className="mt-2 leading-7 text-muted">{t(`${audience}Benefits`)}</p>
                    <Link
                      className="mt-5 inline-flex items-center gap-2 font-semibold text-brand dark:text-accent"
                      to={dest}
                    >
                      {t(`${audience}Cta`)}
                      <ArrowRight size={16} />
                    </Link>
                  </Card>
                )
              })}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-content px-5 py-20">
        <Reveal>
          <h2 className="text-3xl font-semibold">{t('faqTitle')}</h2>
          <div className="mt-7 divide-y divide-border rounded-2xl border border-border bg-surface">
            {faqs.map((faq, index) => (
              <div key={faq} className="px-5">
                <h3>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 py-5 text-left font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    aria-expanded={faqOpen === index}
                    aria-controls={`${faq}-answer`}
                    onClick={() => setFaqOpen(faqOpen === index ? -1 : index)}
                  >
                    {t(`${faq}Question`)}
                    <ChevronDown
                      className={`shrink-0 transition-transform ${faqOpen === index ? 'rotate-180' : ''}`}
                      size={19}
                    />
                  </button>
                </h3>
                <div
                  id={`${faq}-answer`}
                  hidden={faqOpen !== index}
                  className="max-w-3xl pb-5 leading-7 text-muted"
                >
                  {t(`${faq}Answer`)}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="bg-brand text-bg">
        <div className="mx-auto flex max-w-content flex-col items-start justify-between gap-6 px-5 py-16 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-accent">{t('finalEyebrow')}</p>
            <h2 className="mt-2 max-w-2xl font-display text-3xl sm:text-4xl">{t('finalTitle')}</h2>
            <p className="mt-3 max-w-2xl text-bg/75">{t('finalText')}</p>
          </div>
          <Link
            to="/registo"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent px-5 py-3.5 font-semibold text-brand transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bg"
          >
            {t('finalCta')}
            <Check size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
