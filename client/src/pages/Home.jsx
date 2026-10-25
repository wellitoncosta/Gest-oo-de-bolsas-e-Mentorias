import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, Compass, GraduationCap, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import Card from '../components/ui/Card'
import KpiCard from '../components/ui/KpiCard'
import heroImage from '../assets/hero.png'

export default function Home() {
  const { t } = useTranslation('home')
  const [stats, setStats] = useState({})
  useEffect(() => { api.get('/dashboard/estatisticas').then(res => setStats(res.data)).catch(() => {}) }, [])
  const totalApplications = stats.candidaturasPorEstado?.reduce((sum, item) => sum + item._count.status, 0) || 0
  const cards = [
    { icon: GraduationCap, title: t('scholarshipsTitle'), text: t('scholarshipsText') },
    { icon: UsersRound, title: t('mentoringTitle'), text: t('mentoringText') },
    { icon: Compass, title: t('progressTitle'), text: t('progressText') },
  ]
  return <div className="animate-fade-in">
    <section className="relative isolate overflow-hidden bg-bg">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_rgb(var(--accent)_/_0.12),_transparent_42%),radial-gradient(ellipse_at_bottom_left,_rgb(var(--brand)_/_0.09),_transparent_45%)]" />
      <div className="mx-auto grid max-w-content items-center gap-12 px-5 py-20 sm:py-28 lg:grid-cols-[1.15fr_.85fr]">
        <div className="max-w-2xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3.5 py-2 text-sm font-medium text-brand dark:text-accent"><BookOpenCheck size={16} />{t('eyebrow')}</div>
          <h1 className="text-5xl font-semibold leading-[1.04] text-text sm:text-6xl lg:text-7xl">{t('title')}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted sm:text-xl">{t('subtitle')}</p>
          <div className="mt-9 flex flex-wrap gap-3"><Link to="/bolsas" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3.5 font-semibold text-bg shadow-lg shadow-brand/15 hover:-translate-y-0.5 hover:bg-brand/90">{t('browseScholarships')}<ArrowRight size={18} /></Link><Link to="/mentores" className="rounded-xl border border-border bg-surface px-5 py-3.5 font-semibold text-text hover:-translate-y-0.5 hover:bg-bg">{t('meetMentors')}</Link></div>
        </div>
        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-5 rounded-[2rem] bg-accent/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-surface p-3 shadow-2xl shadow-brand/10"><img src={heroImage} alt="" className="aspect-[4/3] w-full rounded-[1.25rem] object-cover" /><div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-border/70 bg-surface/90 p-4 shadow-lg backdrop-blur"><p className="text-xs font-semibold uppercase tracking-[.16em] text-accent">B&amp;M</p><p className="mt-1 font-display text-xl text-text">{t('numbers')}</p></div></div>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-content px-5 py-16 sm:py-20"><div className="grid gap-5 md:grid-cols-3">{cards.map(({ icon: Icon, title, text }) => <Card key={title} className="group"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand transition group-hover:bg-accent/15 group-hover:text-accent"><Icon size={23} /></div><h2 className="text-xl font-semibold text-text">{title}</h2><p className="mt-2 leading-7 text-muted">{text}</p></Card>)}</div></section>
    <section className="border-y border-border bg-surface/60"><div className="mx-auto max-w-content px-5 py-14"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[.14em] text-accent">B&amp;M</p><h2 className="mt-2 text-3xl font-semibold text-text">{t('numbers')}</h2></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><KpiCard label={t('openScholarships')} value={stats.bolsasAbertas || 0} icon={GraduationCap} /><KpiCard label={t('mentors')} value={stats.totalMentores || 0} icon={UsersRound} /><KpiCard label={t('sessions')} value={stats.mentoriasAgendadas || 0} icon={BookOpenCheck} /><KpiCard label={t('applications')} value={totalApplications} icon={Compass} /></div></div></section>
  </div>
}
