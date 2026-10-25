import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  CalendarDays,
  Check,
  Clock3,
  LockKeyhole,
  Settings2,
  ShieldAlert,
  UserRound,
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../design/ThemeProvider'
import { useConfirm } from '../context/ConfirmContext'
import { useToast } from '../context/ToastContext'
import Skeleton from '../components/ui/Skeleton'
import { fusoDoNavegador, fusosHorarios } from '../services/datas'
import { traduzirErro } from '../services/traduzirErro'
import AreaSelect from '../components/AreaSelect'
import { conteudo } from '../services/conteudo'

const emptyForm = {
  nome: '',
  telefone: '',
  area: '',
  instituicao: '',
  biografia: '',
  biografiaEn: '',
  fusoHorario: fusoDoNavegador(),
  linkReuniao: '',
}

export default function MinhaConta() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['account', 'common', 'auth'])
  const { mode, setMode } = useTheme()
  const confirm = useConfirm()
  const toast = useToast()
  const [perfil, setPerfil] = useState(null)
  const [resumo, setResumo] = useState(null)
  const [loadingPerfil, setLoadingPerfil] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [original, setOriginal] = useState(emptyForm)
  const [senha, setSenha] = useState({ atual: '', nova: '' })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [senhaApagar, setSenhaApagar] = useState('')
  const [aba, setAba] = useState('profile')
  const [busy, setBusy] = useState(false)
  const [themePreview, setThemePreview] = useState(mode)
  const sujo = useMemo(() => JSON.stringify(form) !== JSON.stringify(original), [form, original])

  useEffect(() => {
    let active = true
    Promise.allSettled([api.get('/conta'), api.get('/conta/resumo')])
      .then(([p, r]) => {
        if (!active) return
        if (p.status === 'rejected') {
          toast.error(traduzirErro(p.reason))
          return
        }
        const dados = {
          ...emptyForm,
          ...p.value.data,
          telefone: p.value.data.telefone || '',
          area: p.value.data.area || '',
          instituicao: p.value.data.instituicao || '',
          biografia: p.value.data.biografia || '',
          biografiaEn: p.value.data.biografiaEn || '',
          linkReuniao: p.value.data.linkReuniao || '',
        }
        setPerfil(p.value.data)
        setForm(dados)
        setOriginal(dados)
        if (r.status === 'fulfilled') setResumo(r.value.data)
        else toast.error(traduzirErro(r.reason))
      })
      .finally(() => {
        if (active) {
          setBusy(false)
          setLoadingPerfil(false)
        }
      })
    return () => {
      active = false
    }
  }, [toast])

  const field = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const guardar = async (event) => {
    event?.preventDefault()
    setBusy(true)
    try {
      const { data } = await api.put('/conta', form)
      const next = { ...emptyForm, ...data, linkReuniao: data.linkReuniao || '' }
      setPerfil(data)
      setForm(next)
      setOriginal(next)
      toast.success(t('account:saved'))
    } catch (err) {
      toast.error(traduzirErro(err))
    } finally {
      setBusy(false)
    }
  }
  const alterarSenha = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await api.put('/conta/senha', senha)
      setSenha({ atual: '', nova: '' })
      toast.success(t('account:passwordSaved'))
    } catch (err) {
      toast.error(traduzirErro(err))
    } finally {
      setBusy(false)
    }
  }
  const apagarConta = async (event) => {
    event.preventDefault()
    if (!senhaApagar || !(await confirm({ message: t('account:deleteConfirm') }))) return
    setBusy(true)
    try {
      await api.delete('/conta', { data: { senha: senhaApagar } })
      await logout()
      navigate('/')
    } catch (err) {
      toast.error(traduzirErro(err))
    } finally {
      setBusy(false)
    }
  }
  const descartar = () => {
    setForm(original)
    setThemePreview(mode)
  }
  const aplicarTema = (value) => {
    setThemePreview(value)
    setMode(value)
  }
  const iniciais = (perfil?.nome || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const roleKey =
    perfil?.role === 'MENTOR' ? 'mentor' : perfil?.role === 'ADMIN' ? 'admin' : 'student'
  const faltas = [
    !form.telefone && t('common:phone'),
    !form.instituicao && t('common:organization'),
    !form.area && t('account:field'),
    !form.biografia && t('account:biography'),
  ].filter(Boolean)
  const percentagem = Math.round(((4 - faltas.length) / 4) * 100)
  const forca =
    senha.nova.length >= 12 &&
    /[A-Z]/.test(senha.nova) &&
    /\d/.test(senha.nova) &&
    /[^A-Za-z0-9]/.test(senha.nova)
      ? 100
      : senha.nova.length >= 8
        ? 65
        : senha.nova.length
          ? 30
          : 0
  const tabs = [
    ['profile', UserRound, t('account:tabProfile')],
    ['security', LockKeyhole, t('account:tabSecurity')],
    ['preferences', Settings2, t('account:tabPreferences')],
    ['activity', Clock3, t('account:tabActivity')],
  ]

  if (!perfil && loadingPerfil)
    return (
      <div className="mx-auto grid max-w-content gap-5 px-5 py-10 md:grid-cols-[300px_1fr]">
        <Skeleton className="h-80" />
        <Skeleton className="h-[560px]" />
      </div>
    )
  if (!perfil)
    return (
      <div className="mx-auto max-w-xl px-5 py-16 text-center">
        <h1 className="text-2xl font-bold">{t('account:title')}</h1>
        <p className="mt-3 text-muted">{t('account:loadError')}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 rounded-xl bg-brand px-4 py-2.5 font-semibold text-white"
        >
          {t('account:retry')}
        </button>
      </div>
    )

  return (
    <div className="mx-auto max-w-content px-4 py-8 pb-28 sm:px-6">
      <div className="mb-7">
        <p className="text-sm font-semibold text-brand">B&amp;M · {t('account:workspace')}</p>
        <h1 className="mt-1 text-3xl font-bold">{t('account:title')}</h1>
        <p className="mt-2 text-muted">{t('account:subtitle')}</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-brand/5">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-brand text-2xl font-bold text-white">
              {iniciais}
            </div>
            <h2 className="mt-4 text-xl font-bold">{perfil.nome}</h2>
            <span className="mt-2 inline-flex rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-text">
              {t(`common:${roleKey}`)}
            </span>
            <p className="mt-4 break-all text-sm text-muted">{perfil.email}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted">
              <Building2 size={15} />
              {perfil.instituicao || t('account:noInstitution')}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted">
              <CalendarDays size={15} />
              {t('account:memberSince')}{' '}
              {new Date(perfil.createdAt).toLocaleDateString(
                i18n.language === 'en' ? 'en-GB' : 'pt-PT',
                { month: 'short', year: 'numeric' },
              )}
            </p>
            <div className="mt-6">
              <div className="flex justify-between text-xs">
                <span className="font-semibold">{t('account:completion')}</span>
                <span className="text-muted">{percentagem}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${percentagem}%` }}
                />
              </div>
              {faltas.length > 0 && (
                <p className="mt-3 text-xs leading-5 text-muted">
                  {t('account:completeHint', { fields: faltas.join(', ') })}
                </p>
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-lg shadow-brand/5">
            <h3 className="font-semibold">{t('account:quickSummary')}</h3>
            {perfil.role === 'ESTUDANTE' && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric
                  label={t('account:applications')}
                  value={resumo?.totais?.candidaturas ?? '—'}
                />
                <Metric label={t('account:sessions')} value={resumo?.totais?.mentorias ?? '—'} />
              </div>
            )}
            {perfil.role === 'MENTOR' && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric
                  label={t('account:completedSessions')}
                  value={resumo?.totais?.concluidas ?? '—'}
                />
                <Metric
                  label={t('account:averageRating')}
                  value={
                    resumo?.totais?.avaliacaoMedia
                      ? Number(resumo.totais.avaliacaoMedia).toFixed(1)
                      : '—'
                  }
                />
              </div>
            )}
            {perfil.role === 'ADMIN' && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {Object.entries(resumo?.totais || {}).map(([key, value]) => (
                  <Metric key={key} label={t(`account:${key}`)} value={value} />
                ))}
              </div>
            )}
          </section>
        </aside>

        <section className="min-w-0 rounded-2xl border border-border bg-surface shadow-lg shadow-brand/5">
          <div
            role="tablist"
            aria-label={t('account:settings')}
            className="flex gap-1 overflow-x-auto border-b border-border p-2"
          >
            {tabs.map(([key, Icon, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={aba === key}
                onClick={() => setAba(key)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${aba === key ? 'bg-brand text-white' : 'text-muted hover:bg-bg hover:text-text'}`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          <div className="p-5 sm:p-7">
            {aba === 'profile' && (
              <form onSubmit={guardar} className="space-y-6">
                <Section title={t('account:personalData')}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label={t('common:name')}
                      value={form.nome}
                      onChange={(v) => field('nome', v)}
                      required
                    />
                    <Field label={t('common:email')} value={perfil.email} disabled />
                    <Field
                      label={t('common:phone')}
                      value={form.telefone}
                      onChange={(v) => field('telefone', v)}
                    />
                    <label className="block text-sm font-medium">
                      {t('account:field')}
                      <AreaSelect
                        includeEmpty
                        emptyLabel={t('areas:choose')}
                        value={form.area}
                        onChange={(v) => field('area', v || null)}
                        className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm"
                      />
                    </label>
                  </div>
                </Section>
                <Section title={t('account:institutionSection')}>
                  <Field
                    label={t('common:organization')}
                    value={form.instituicao}
                    onChange={(v) => field('instituicao', v)}
                    maxLength={120}
                  />
                </Section>
                <Section title={t('account:biography')}>
                  <textarea
                    value={form.biografia}
                    onChange={(e) => field('biografia', e.target.value)}
                    maxLength={600}
                    rows={5}
                    className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm"
                    placeholder={t('account:biographyHint')}
                  />
                  <p className="mt-1 text-right text-xs text-muted">
                    {(form.biografia || '').length}/600
                  </p>
                  {perfil.role === 'MENTOR' && (
                    <>
                      <label className="block text-sm font-medium">
                        {t('account:biographyEn')}
                      </label>
                      <textarea
                        value={form.biografiaEn}
                        onChange={(e) => field('biografiaEn', e.target.value)}
                        maxLength={600}
                        rows={5}
                        className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm"
                        placeholder={t('account:biographyEnHint')}
                      />
                      {!form.biografiaEn.trim() && form.biografia && (
                        <p className="text-xs text-muted">{t('common:contentFallback')}</p>
                      )}
                    </>
                  )}
                </Section>
                {perfil.role === 'MENTOR' && (
                  <Section title={t('account:meetingLink')}>
                    <Field
                      label={t('account:meetingLinkHint')}
                      type="url"
                      value={form.linkReuniao}
                      onChange={(v) => field('linkReuniao', v)}
                      placeholder="https://meet.google.com/..."
                    />
                    <p className="mt-1 text-xs text-muted">{t('account:httpsOnly')}</p>
                  </Section>
                )}
              </form>
            )}
            {aba === 'security' && (
              <div className="space-y-7">
                <form onSubmit={alterarSenha} className="max-w-xl space-y-4">
                  <Section title={t('account:changePassword')}>
                    <Field
                      label={t('account:currentPassword')}
                      type="password"
                      value={senha.atual}
                      onChange={(v) => setSenha({ ...senha, atual: v })}
                      required
                    />
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        {t('auth:newPassword')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={mostrarSenha ? 'text' : 'password'}
                          value={senha.nova}
                          onChange={(e) => setSenha({ ...senha, nova: e.target.value })}
                          className="min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-4 py-3"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSenha(!mostrarSenha)}
                          className="rounded-xl border border-border px-3 text-sm"
                        >
                          {mostrarSenha ? t('auth:hide') : t('auth:show')}
                        </button>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-surface-2">
                        <div
                          className={`h-2 rounded-full ${forca > 65 ? 'bg-accent' : forca ? 'bg-danger' : ''}`}
                          style={{ width: `${forca}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted">{t('account:passwordHint')}</p>
                    </div>
                    <button
                      disabled={busy}
                      className="rounded-xl bg-brand px-4 py-2.5 font-semibold text-white disabled:opacity-60"
                    >
                      {t('account:changePassword')}
                    </button>
                  </Section>
                </form>
                <button
                  onClick={async () => {
                    await logout()
                    navigate('/')
                  }}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-bg"
                >
                  {t('account:signOut')}
                </button>
                <form
                  onSubmit={apagarConta}
                  className="max-w-xl rounded-2xl border border-danger/30 bg-danger/5 p-5"
                >
                  <h3 className="flex items-center gap-2 font-semibold text-danger">
                    <ShieldAlert size={18} />
                    {t('account:dangerZone')}
                  </h3>
                  <p className="mt-2 text-sm text-muted">{t('account:deleteDescription')}</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="password"
                      value={senhaApagar}
                      onChange={(e) => setSenhaApagar(e.target.value)}
                      placeholder={t('account:confirmPassword')}
                      className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2"
                    />
                    <button
                      disabled={busy}
                      className="rounded-xl bg-danger px-4 py-2 font-semibold text-white"
                    >
                      {t('account:delete')}
                    </button>
                  </div>
                </form>
              </div>
            )}
            {aba === 'preferences' && (
              <div className="max-w-xl space-y-6">
                <Section title={t('account:language')}>
                  <select
                    value={i18n.language.startsWith('en') ? 'en' : 'pt'}
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3"
                  >
                    <option value="pt">Português</option>
                    <option value="en">English</option>
                  </select>
                </Section>
                <Section title={t('account:theme')}>
                  <div className="grid grid-cols-3 gap-2">
                    {['light', 'dark', 'system'].map((item) => (
                      <button
                        key={item}
                        onClick={() => aplicarTema(item)}
                        className={`rounded-xl border p-3 text-sm ${themePreview === item ? 'border-brand bg-brand/10 font-semibold text-brand' : 'border-border hover:bg-bg'}`}
                      >
                        {t(`account:theme_${item}`)}
                        {themePreview === item && <Check className="mx-auto mt-1" size={16} />}
                      </button>
                    ))}
                  </div>
                </Section>
                <Section title={t('account:timezone')}>
                  <input
                    list="account-timezones"
                    value={form.fusoHorario}
                    onChange={(e) => field('fusoHorario', e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3"
                  />
                  <datalist id="account-timezones">
                    {fusosHorarios().map((zone) => (
                      <option key={zone} value={zone} />
                    ))}
                  </datalist>
                  <p className="mt-1 text-xs text-muted">{t('account:timezoneHint')}</p>
                </Section>
              </div>
            )}
            {aba === 'activity' && (
              <div className="grid gap-6 xl:grid-cols-2">
                <Section title={t('account:recentApplications')}>
                  <ActivityList empty={t('account:noApplications')}>
                    {(resumo?.candidaturas || []).map((item) => (
                      <Link
                        key={item.id}
                        to={`/bolsas/${item.bolsa.id}`}
                        className="flex items-start justify-between gap-3 rounded-xl bg-surface-2 p-3 hover:bg-bg"
                      >
                        <span className="font-medium">
                          {conteudo(item.bolsa, 'titulo', i18n.language)}
                        </span>
                        <span className="text-xs text-muted">
                          {new Date(item.createdAt).toLocaleDateString(
                            i18n.language.startsWith('en') ? 'en-GB' : 'pt-PT',
                          )}
                        </span>
                      </Link>
                    ))}
                  </ActivityList>
                </Section>
                <Section title={t('account:recentSessions')}>
                  <ActivityList empty={t('account:noSessions')}>
                    {(resumo?.mentorias || []).map((item) => (
                      <Link
                        key={item.id}
                        to="/mentorias"
                        className="flex items-start justify-between gap-3 rounded-xl bg-surface-2 p-3 hover:bg-bg"
                      >
                        <span>
                          <span className="block font-medium">{item.tema}</span>
                          <span className="text-xs text-muted">
                            {perfil.role === 'MENTOR' ? item.estudante.nome : item.mentor.nome}
                          </span>
                        </span>
                        <span className="text-xs text-muted">
                          {new Date(item.disponibilidade.inicio).toLocaleDateString(
                            i18n.language.startsWith('en') ? 'en-GB' : 'pt-PT',
                          )}
                        </span>
                      </Link>
                    ))}
                  </ActivityList>
                </Section>
              </div>
            )}
          </div>
        </section>
      </div>
      {sujo && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">{t('account:unsaved')}</p>
            <div className="flex gap-2">
              <button
                onClick={descartar}
                className="rounded-xl border border-border px-4 py-2 text-sm"
              >
                {t('account:discard')}
              </button>
              <button
                onClick={guardar}
                disabled={busy}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? t('common:loading') : t('common:save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value = '', onChange, disabled = false, ...props }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        value={value || ''}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm disabled:opacity-60"
        {...props}
      />
    </label>
  )
}
function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </section>
  )
}
function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}
function ActivityList({ children, empty }) {
  return children.length ? (
    <div className="space-y-2">{children}</div>
  ) : (
    <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">{empty}</p>
  )
}
