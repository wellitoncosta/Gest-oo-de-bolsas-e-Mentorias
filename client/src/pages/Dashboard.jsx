import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useTranslation } from 'react-i18next'
import { traduzirEstado } from '../services/traduzirErro'

const colors = ['rgb(var(--brand))', 'rgb(var(--accent))', 'rgb(var(--muted))', 'rgb(var(--danger))']
export default function Dashboard() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation(['dashboard', 'common'])
  const [stats, setStats] = useState(null), [minha, setMinha] = useState(null), [loading, setLoading] = useState(true)
  useEffect(() => { const load = async () => { try { const res = await api.get('/dashboard/estatisticas'); setStats(res.data); if (user) { const personal = await api.get('/dashboard/minha-area'); setMinha(personal.data) } } catch (err) { console.error(err) } finally { setLoading(false) } }; load() }, [user])
  if (loading) return <div className="p-8 text-center">{t('common:loading')}</div>
  const applications = stats?.candidaturasPorEstado?.map((item, i) => ({ name: traduzirEstado(item.status), value: item._count.status, fill: colors[i % colors.length] })) || []
  const byArea = stats?.bolsasPorArea?.map(item => ({ name: item.area, total: item._count.area })) || []
  const kpis = [[t('dashboard:openScholarships'), stats?.bolsasAbertas || 0], [t('dashboard:mentors'), stats?.totalMentores || 0], [t('dashboard:scheduled'), stats?.mentoriasAgendadas || 0], [t('dashboard:applications'), applications.reduce((sum, item) => sum + item.value, 0)]]
  return <div className="mx-auto max-w-content px-5 py-10"><h1 className="mb-7 text-3xl font-semibold">{t('nav:dashboard')}</h1>
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{kpis.map(([label, value]) => <div key={label} className="rounded-2xl border border-border bg-surface p-5 shadow-sm"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-semibold">{new Intl.NumberFormat(i18n.language?.startsWith('en') ? 'en-GB' : 'pt-PT').format(value)}</p></div>)}</div>
    <div className="mb-8 grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-border bg-surface p-5"><h2 className="mb-4 text-lg font-semibold">{t('dashboard:byArea')}</h2><ResponsiveContainer width="100%" height={250}><BarChart data={byArea}><XAxis dataKey="name" stroke="rgb(var(--muted))" /><YAxis stroke="rgb(var(--muted))" /><Tooltip /><Bar dataKey="total" fill="rgb(var(--brand))" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></section><section className="rounded-2xl border border-border bg-surface p-5"><h2 className="mb-4 text-lg font-semibold">{t('dashboard:byStatus')}</h2><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={applications} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{applications.map((item, i) => <Cell key={i} fill={item.fill} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></section></div>
    {user && minha && <section className="rounded-2xl border border-border bg-surface p-5"><h2 className="mb-5 text-xl font-semibold">{t('dashboard:myArea')}</h2><div className="grid gap-6 md:grid-cols-2"><div><div className="mb-3 flex justify-between"><h3 className="font-semibold">{t('dashboard:myApplications')}</h3>{user.role === 'ESTUDANTE' && <a href="/candidaturas" className="text-sm text-brand">{t('dashboard:viewAll')}</a>}</div>{minha.candidaturas.length ? <ul className="space-y-2">{minha.candidaturas.slice(0, 5).map(c => <li key={c.id} className="rounded-xl border border-border p-3"><div className="font-medium">{c.bolsa.titulo}</div><div className="text-sm text-muted">{traduzirEstado(c.status)}</div></li>)}</ul> : <p className="text-sm text-muted">{t('dashboard:noneApplications')}</p>}</div><div><h3 className="mb-3 font-semibold">{t('dashboard:myMentoring')}</h3>{minha.mentorias.length ? <ul className="space-y-2">{minha.mentorias.slice(0, 5).map(m => <li key={m.id} className="rounded-xl border border-border p-3"><div className="font-medium">{m.tema}</div><div className="text-sm text-muted">{traduzirEstado(m.status)}</div></li>)}</ul> : <p className="text-sm text-muted">{t('dashboard:noneMentoring')}</p>}</div></div></section>}
  </div>
}
