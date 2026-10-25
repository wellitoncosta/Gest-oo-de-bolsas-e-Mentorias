import { useTranslation } from 'react-i18next'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const eixo = { fill: 'rgb(var(--muted))', fontSize: 11 }

export default function DashboardCharts({ data, mode = 'admin' }) {
  const { t, i18n } = useTranslation(['dashboard', 'areas'])
  const fmtMes = (value) => new Intl.DateTimeFormat(i18n.language?.startsWith('en') ? 'en-GB' : 'pt-PT', { month: 'short' }).format(new Date(value))
  const fmtDia = (value) => new Intl.DateTimeFormat(i18n.language?.startsWith('en') ? 'en-GB' : 'pt-PT', { weekday: 'short' }).format(new Date(value))
  const fmtArea = (value) => i18n.t(`areas:${value}`)
  if (mode === 'public' || mode === 'mentor') {
    const publicMode = mode === 'public'
    const series = publicMode ? data.bolsasPublicadasPorMes : data.horasPorSemana
    const key = publicMode ? 'total' : 'horas'
    const label = publicMode ? t('scholarships') : t('weeklyHours')
    return <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={series || []}>
        <defs><linearGradient id={`simple-${mode}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(var(--brand))" stopOpacity={0.3} /><stop offset="95%" stopColor="rgb(var(--brand))" stopOpacity={0.02} /></linearGradient></defs>
        <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={publicMode ? 'mes' : 'semana'} tickFormatter={publicMode ? fmtMes : fmtDia} tick={eixo} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={!publicMode} tick={eixo} axisLine={false} tickLine={false} />
        <Tooltip labelFormatter={publicMode ? fmtMes : fmtDia} contentStyle={{ background: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))', borderRadius: 12 }} />
        <Area type="monotone" dataKey={key} name={label} stroke="rgb(var(--brand))" fill={`url(#simple-${mode}-fill)`} strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  }
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">{t('adminApplicationsMonth')}</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data.candidaturasPorMes}>
            <defs><linearGradient id="applicationsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(var(--brand))" stopOpacity={0.3} /><stop offset="95%" stopColor="rgb(var(--brand))" stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mes" tickFormatter={fmtMes} tick={eixo} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={eixo} axisLine={false} tickLine={false} />
            <Tooltip labelFormatter={fmtMes} contentStyle={{ background: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))', borderRadius: 12 }} />
            <Area type="monotone" dataKey="total" name={t('applications')} stroke="rgb(var(--brand))" fill="url(#applicationsFill)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </section>
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">{t('adminMentoringWeek')}</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.mentoriasPorSemana}>
            <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="semana" tickFormatter={fmtDia} tick={eixo} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={eixo} axisLine={false} tickLine={false} />
            <Tooltip labelFormatter={fmtDia} contentStyle={{ background: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))', borderRadius: 12 }} />
            <Bar dataKey="total" name={t('sessions')} fill="rgb(var(--accent))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm lg:col-span-2">
        <h2 className="mb-4 font-semibold">{t('adminScholarshipArea')}</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.bolsasPorArea} layout="vertical" margin={{ left: 12 }}>
            <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={eixo} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="area" tickFormatter={fmtArea} tick={eixo} width={105} axisLine={false} tickLine={false} />
            <Tooltip labelFormatter={fmtArea} contentStyle={{ background: 'rgb(var(--surface))', borderColor: 'rgb(var(--border))', borderRadius: 12 }} />
            <Bar dataKey="total" name={t('scholarships')} fill="rgb(var(--brand))" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  )
}
