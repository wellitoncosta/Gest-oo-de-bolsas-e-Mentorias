import { useCallback, useEffect, useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import api from '../services/api'
import { useTranslation } from 'react-i18next'
import { localeFor } from '../i18n'
import { traduzirErro, traduzirEstado } from '../services/traduzirErro'
import { useConfirm } from '../context/ConfirmContext'
import { useToast } from '../context/ToastContext'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { useRealtime } from '../context/RealtimeContext'
import AreaSelect from '../components/AreaSelect'
import { conteudo, conteudoTemFallback } from '../services/conteudo'

function BolsasAdmin() {
  const { t, i18n } = useTranslation(['admin', 'common', 'areas'])
  const confirm = useConfirm()
  const toast = useToast()
  const [bolsas, setBolsas] = useState(null)
  const [form, setForm] = useState({
    titulo: '',
    tituloEn: '',
    descricao: '',
    descricaoEn: '',
    entidade: '',
    valor: '',
    valorEn: '',
    requisitos: '',
    requisitosEn: '',
    area: '',
    dataLimite: '',
    status: 'ABERTA',
  })
  const [editando, setEditando] = useState(null)
  const [idiomaFormulario, setIdiomaFormulario] = useState('pt')

  const carregar = useCallback(async () => {
    const res = await api.get('/bolsas')
    setBolsas(res.data)
  }, [])
  useEffect(() => {
    carregar()
  }, [carregar])
  useRealtime(['bolsa:criada', 'bolsa:atualizada', 'bolsa:removida'], () => carregar())

  const criar = async (e) => {
    e.preventDefault()
    if (editando) {
      await api.put(`/bolsas/${editando}`, form)
      setEditando(null)
    } else {
      await api.post('/bolsas', form)
    }
    setForm({
      titulo: '',
      tituloEn: '',
      descricao: '',
      descricaoEn: '',
      entidade: '',
      valor: '',
      valorEn: '',
      requisitos: '',
      requisitosEn: '',
      area: '',
      dataLimite: '',
      status: 'ABERTA',
    })
    setIdiomaFormulario('pt')
    carregar()
  }

  const editar = (b) => {
    setEditando(b.id)
    setIdiomaFormulario('pt')
    setForm({
      titulo: b.titulo,
      tituloEn: b.tituloEn || '',
      descricao: b.descricao,
      descricaoEn: b.descricaoEn || '',
      entidade: b.entidade,
      valor: b.valor || '',
      valorEn: b.valorEn || '',
      requisitos: b.requisitos || '',
      requisitosEn: b.requisitosEn || '',
      area: b.area,
      dataLimite: b.dataLimite.split('T')[0],
      status: b.status,
    })
  }

  const remover = async (id) => {
    if (!(await confirm({ message: t('admin:removeConfirm') }))) return
    await api.delete(`/bolsas/${id}`)
    carregar()
    toast.success(t('admin:scholarshipRemoved'))
  }

  return (
    <div>
      <h2 className="font-bold text-xl mb-4">{t('admin:scholarshipManagement')}</h2>
      <form
        onSubmit={criar}
        className="bg-surface p-4 rounded shadow mb-6 grid md:grid-cols-2 gap-3"
      >
        <div className="flex gap-2 md:col-span-2">
          {['pt', 'en'].map((idioma) => (
            <button
              type="button"
              key={idioma}
              onClick={() => setIdiomaFormulario(idioma)}
              className={`rounded-lg px-3 py-1.5 text-sm ${idiomaFormulario === idioma ? 'bg-brand text-white' : 'bg-bg'}`}
            >
              {idioma.toUpperCase()}
            </button>
          ))}
          {idiomaFormulario === 'en' && (
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  tituloEn: f.titulo,
                  descricaoEn: f.descricao,
                  valorEn: f.valor,
                  requisitosEn: f.requisitos,
                }))
              }
              className="ml-auto rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              {t('admin:copyPortuguese')}
            </button>
          )}
        </div>
        <input
          placeholder={t('common:title')}
          value={form[idiomaFormulario === 'en' ? 'tituloEn' : 'titulo']}
          onChange={(e) =>
            setForm({
              ...form,
              [idiomaFormulario === 'en' ? 'tituloEn' : 'titulo']: e.target.value,
            })
          }
          className="rounded-xl border border-border px-3 py-2"
          required={idiomaFormulario === 'pt'}
        />
        <input
          placeholder={t('common:organization')}
          value={form.entidade}
          onChange={(e) => setForm({ ...form, entidade: e.target.value })}
          className="rounded-xl border border-border px-3 py-2"
          required
        />
        <AreaSelect
          includeEmpty
          emptyLabel={t('areas:choose')}
          value={form.area}
          onChange={(value) => setForm({ ...form, area: value })}
          className="rounded-xl border border-border px-3 py-2"
          required
        />
        <input
          placeholder={t('common:amount')}
          value={form[idiomaFormulario === 'en' ? 'valorEn' : 'valor']}
          onChange={(e) =>
            setForm({ ...form, [idiomaFormulario === 'en' ? 'valorEn' : 'valor']: e.target.value })
          }
          className="rounded-xl border border-border px-3 py-2"
        />
        <input
          type="date"
          value={form.dataLimite}
          onChange={(e) => setForm({ ...form, dataLimite: e.target.value })}
          className="border rounded px-3 py-2"
          required
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="ABERTA">{t('status:ABERTA')}</option>
          <option value="FECHADA">{t('status:FECHADA')}</option>
        </select>
        <textarea
          placeholder={t('common:description')}
          value={form[idiomaFormulario === 'en' ? 'descricaoEn' : 'descricao']}
          onChange={(e) =>
            setForm({
              ...form,
              [idiomaFormulario === 'en' ? 'descricaoEn' : 'descricao']: e.target.value,
            })
          }
          className="rounded-xl border border-border px-3 py-2 md:col-span-2"
          rows={2}
        ></textarea>
        <textarea
          placeholder={t('common:requirements')}
          value={form[idiomaFormulario === 'en' ? 'requisitosEn' : 'requisitos']}
          onChange={(e) =>
            setForm({
              ...form,
              [idiomaFormulario === 'en' ? 'requisitosEn' : 'requisitos']: e.target.value,
            })
          }
          className="rounded-xl border border-border px-3 py-2 md:col-span-2"
          rows={2}
        ></textarea>
        {idiomaFormulario === 'pt' &&
          ['tituloEn', 'descricaoEn', 'valorEn', 'requisitosEn'].some(
            (campo) => !form[campo].trim(),
          ) && (
            <p className="text-sm text-amber-700 md:col-span-2">{t('admin:englishFieldsEmpty')}</p>
          )}
        <button className="rounded-xl bg-brand px-4 py-2 text-bg md:col-span-2">
          {editando ? t('admin:update') : t('admin:create')}
        </button>
      </form>
      {!bolsas ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {bolsas.map((b) => (
            <div
              key={b.id}
              className="animate-fade-in bg-surface p-3 rounded shadow flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{conteudo(b, 'titulo', i18n.language)}</div>
                <div className="text-sm text-muted">
                  {b.entidade} • {t(`areas:${b.area}`)} • {traduzirEstado(b.status)}
                </div>
                {conteudoTemFallback(
                  b,
                  ['titulo', 'descricao', 'requisitos', 'valor'],
                  i18n.language,
                ) && <div className="text-xs text-muted">{t('common:contentFallback')}</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => editar(b)} className="rounded-lg bg-bg px-3 py-1 text-sm">
                  {t('admin:edit')}
                </button>
                <button
                  onClick={() => remover(b.id)}
                  className="rounded-lg bg-danger px-3 py-1 text-sm text-bg"
                >
                  {t('common:remove')}
                </button>
              </div>
            </div>
          ))}
          {bolsas.length === 0 && <EmptyState title={t('scholarships:none')} />}
        </div>
      )}
    </div>
  )
}

function UtilizadoresAdmin() {
  const { t } = useTranslation(['admin', 'common'])
  const confirm = useConfirm()
  const [users, setUsers] = useState(null)
  const [erro, setErro] = useState('')
  const carregar = useCallback(async () => {
    const res = await api.get('/utilizadores')
    setUsers(res.data)
  }, [])
  useEffect(() => {
    carregar()
  }, [carregar])
  useRealtime(['conta:bloqueada'], () => carregar())
  const alterar = async (u) => {
    setErro('')
    if (u.role === 'ADMIN') return
    if (
      !(await confirm({
        message: u.bloqueado ? t('admin:unblockConfirm') : t('admin:blockConfirm'),
      }))
    )
      return
    try {
      const res = await api.put(`/utilizadores/${u.id}/bloqueio`, { bloqueado: !u.bloqueado })
      setUsers(users.map((x) => (x.id === u.id ? res.data : x)))
    } catch (err) {
      setErro(traduzirErro(err))
    }
  }
  return (
    <div>
      <h2 className="font-bold text-xl mb-4">{t('admin:users')}</h2>
      {erro && <div className="mb-3 p-3 bg-danger/10 text-danger rounded">{erro}</div>}
      {!users ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-16" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="animate-fade-in bg-surface p-3 rounded shadow flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{u.nome}</div>
                <div className="text-sm text-muted">
                  {u.email} •{' '}
                  {t(
                    u.role === 'ADMIN'
                      ? 'common:admin'
                      : u.role === 'MENTOR'
                        ? 'common:mentor'
                        : 'common:student',
                  )}{' '}
                  •{' '}
                  <Badge tone={u.bloqueado ? 'danger' : 'success'}>
                    {u.bloqueado ? t('admin:blocked') : t('admin:active')}
                  </Badge>
                </div>
              </div>
              {u.role !== 'ADMIN' ? (
                <button
                  onClick={() => alterar(u)}
                  className={`rounded-lg px-3 py-1 text-sm text-bg ${u.bloqueado ? 'bg-accent' : 'bg-danger'}`}
                >
                  {u.bloqueado ? t('admin:unblock') : t('admin:block')}
                </button>
              ) : null}
            </div>
          ))}
          {users.length === 0 && <EmptyState title={t('common:noResults')} />}
        </div>
      )}
    </div>
  )
}

function CandidaturasAdmin() {
  const { t, i18n } = useTranslation(['admin', 'common', 'status'])
  const [cands, setCands] = useState(null)
  const [filtro, setFiltro] = useState('TODAS')
  const [pesquisa, setPesquisa] = useState('')
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const carregar = useCallback(async () => {
    const res = await api.get('/candidaturas')
    setCands(res.data)
  }, [])
  useEffect(() => {
    carregar()
  }, [carregar])
  useRealtime(['candidatura:nova', 'candidatura:estado'], () => carregar())
  const atualizar = async (id, status) => {
    setErro('')
    setMsg('')
    try {
      await api.put(`/candidaturas/${id}/estado`, { status })
      setMsg(
        status === 'APROVADA'
          ? t('admin:approvedMsg')
          : status === 'REJEITADA'
            ? t('admin:rejectedMsg')
            : t('admin:revertedMsg'),
      )
      carregar()
    } catch (err) {
      setErro(traduzirErro(err, t('common:error')))
    }
  }
  const filtradas = (cands || []).filter((c) => {
    if (filtro !== 'TODAS' && c.status !== filtro) return false
    if (pesquisa) {
      const p = pesquisa.toLowerCase()
      if (!(
        c.bolsa?.titulo?.toLowerCase().includes(p) ||
        c.bolsa?.tituloEn?.toLowerCase().includes(p) ||
        c.user?.nome?.toLowerCase().includes(p)
      ))
        return false
    }
    return true
  })
  return (
    <div>
      <h2 className="font-bold text-xl mb-4">{t('admin:applications')}</h2>
      {msg && <div className="mb-3 p-3 bg-accent/10 text-accent rounded">{msg}</div>}
      {erro && <div className="mb-3 p-3 bg-danger/10 text-danger rounded">{erro}</div>}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="TODAS">{t('admin:all')}</option>
          <option value="PENDENTE">{t('admin:pending')}</option>
          <option value="EM_ANALISE">{t('status:EM_ANALISE')}</option>
          <option value="APROVADA">{t('admin:approved')}</option>
          <option value="REJEITADA">{t('admin:rejected')}</option>
        </select>
        <input
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          placeholder={t('admin:search')}
          className="rounded-xl border border-border px-3 py-2"
        />
      </div>
      {cands === null ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.map((c) => (
            <div key={c.id} className="animate-fade-in bg-surface p-3 rounded shadow">
              <div className="flex justify-between mb-2">
                <div>
                  <div className="font-medium">
                    {c.user?.nome} ({c.user?.email}) - {conteudo(c.bolsa, 'titulo', i18n.language)}
                  </div>
                  <div className="text-sm text-muted">
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleString(localeFor(i18n.language))
                      : ''}
                  </div>
                  <Badge
                    className="mt-2"
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
                <div className="flex gap-2">
                  {c.status === 'PENDENTE' && (
                    <>
                      <button
                        onClick={() => atualizar(c.id, 'APROVADA')}
                        className="rounded-lg bg-accent px-3 py-1 text-sm text-bg"
                      >
                        {t('admin:approve')}
                      </button>
                      <button
                        onClick={() => atualizar(c.id, 'REJEITADA')}
                        className="rounded-lg bg-danger px-3 py-1 text-sm text-bg"
                      >
                        {t('admin:reject')}
                      </button>
                    </>
                  )}
                  {c.status !== 'PENDENTE' && (
                    <button
                      onClick={() => atualizar(c.id, 'PENDENTE')}
                      className="rounded-lg bg-accent px-3 py-1 text-sm text-bg"
                    >
                      {t('admin:revert')}
                    </button>
                  )}
                </div>
              </div>
              {c.mensagem && <p className="text-sm text-muted whitespace-pre-wrap">{c.mensagem}</p>}
            </div>
          ))}
          {filtradas.length === 0 && <EmptyState title={t('common:noResults')} />}
        </div>
      )}
    </div>
  )
}

function MentoriasAdmin() {
  const { t } = useTranslation(['admin', 'common'])
  const [mentorias, setMentorias] = useState(null)
  const carregar = useCallback(async () => {
    const res = await api.get('/mentorias')
    setMentorias(res.data)
  }, [])
  useEffect(() => {
    carregar()
  }, [carregar])
  useRealtime(['mentoria:nova', 'mentoria:estado'], () => carregar())
  return (
    <div>
      <h2 className="font-bold text-xl mb-4">{t('admin:mentoring')}</h2>
      {mentorias === null ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {mentorias.map((m) => (
            <div key={m.id} className="animate-fade-in bg-surface p-3 rounded shadow">
              <div className="font-medium">{m.tema}</div>
              <div className="text-sm text-muted">
                {t('admin:mentorStudent', { mentor: m.mentor.nome, student: m.estudante.nome })} •{' '}
                {traduzirEstado(m.status)}
              </div>
            </div>
          ))}
          {mentorias.length === 0 && <EmptyState title={t('dashboard:noneMentoring')} />}
        </div>
      )}
    </div>
  )
}

export default function Admin() {
  const { t } = useTranslation(['admin', 'nav'])
  return (
    <div className="max-w-content mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('admin:title')}</h1>
      <nav className="mb-6 flex flex-wrap gap-2" aria-label={t('admin:title')}>
        <NavLink
          end
          to="/admin"
          className={({ isActive }) =>
            `rounded-xl px-4 py-2 text-sm font-medium ${isActive ? 'bg-brand text-white' : 'bg-surface-2 text-muted hover:text-text'}`
          }
        >
          {t('nav:scholarships')}
        </NavLink>
        <NavLink
          to="/admin/utilizadores"
          className={({ isActive }) =>
            `rounded-xl px-4 py-2 text-sm font-medium ${isActive ? 'bg-brand text-white' : 'bg-surface-2 text-muted hover:text-text'}`
          }
        >
          {t('admin:users')}
        </NavLink>
        <NavLink
          to="/admin/candidaturas"
          className={({ isActive }) =>
            `rounded-xl px-4 py-2 text-sm font-medium ${isActive ? 'bg-brand text-white' : 'bg-surface-2 text-muted hover:text-text'}`
          }
        >
          {t('admin:applications')}
        </NavLink>
        <NavLink
          to="/admin/mentorias"
          className={({ isActive }) =>
            `rounded-xl px-4 py-2 text-sm font-medium ${isActive ? 'bg-brand text-white' : 'bg-surface-2 text-muted hover:text-text'}`
          }
        >
          {t('admin:mentoring')}
        </NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<BolsasAdmin />} />
        <Route path="/utilizadores" element={<UtilizadoresAdmin />} />
        <Route path="/candidaturas" element={<CandidaturasAdmin />} />
        <Route path="/mentorias" element={<MentoriasAdmin />} />
      </Routes>
    </div>
  )
}
