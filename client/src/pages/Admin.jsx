import { useEffect, useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import api from '../services/api'
import { useTranslation } from 'react-i18next'
import { localeFor } from '../i18n'
import { traduzirErro, traduzirEstado } from '../services/traduzirErro'
import { useConfirm } from '../context/ConfirmContext'
import { useToast } from '../context/ToastContext'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'

function BolsasAdmin() {
  const { t } = useTranslation(['admin', 'common'])
  const confirm = useConfirm()
  const toast = useToast()
  const [bolsas, setBolsas] = useState(null)
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    entidade: '',
    valor: '',
    requisitos: '',
    area: '',
    dataLimite: '',
    status: 'ABERTA',
  })
  const [editando, setEditando] = useState(null)

  const carregar = async () => {
    const res = await api.get('/bolsas')
    setBolsas(res.data)
  }
  useEffect(() => {
    carregar()
  }, [])

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
      descricao: '',
      entidade: '',
      valor: '',
      requisitos: '',
      area: '',
      dataLimite: '',
      status: 'ABERTA',
    })
    carregar()
  }

  const editar = (b) => {
    setEditando(b.id)
    setForm({
      titulo: b.titulo,
      descricao: b.descricao,
      entidade: b.entidade,
      valor: b.valor || '',
      requisitos: b.requisitos || '',
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
        <input
          placeholder={t('common:title')}
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          className="rounded-xl border border-border px-3 py-2"
          required
        />
        <input
          placeholder={t('common:organization')}
          value={form.entidade}
          onChange={(e) => setForm({ ...form, entidade: e.target.value })}
          className="rounded-xl border border-border px-3 py-2"
          required
        />
        <input
          placeholder={t('common:area')}
          value={form.area}
          onChange={(e) => setForm({ ...form, area: e.target.value })}
          className="rounded-xl border border-border px-3 py-2"
          required
        />
        <input
          placeholder={t('common:amount')}
          value={form.valor}
          onChange={(e) => setForm({ ...form, valor: e.target.value })}
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
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target_value || e.target.value })}
          className="rounded-xl border border-border px-3 py-2 md:col-span-2"
          rows={2}
        ></textarea>
        <textarea
          placeholder={t('common:requirements')}
          value={form.requisitos}
          onChange={(e) => setForm({ ...form, requisitos: e.target.value })}
          className="rounded-xl border border-border px-3 py-2 md:col-span-2"
          rows={2}
        ></textarea>
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
              className="bg-surface p-3 rounded shadow flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{b.titulo}</div>
                <div className="text-sm text-muted">
                  {b.entidade} • {traduzirEstado(b.status)}
                </div>
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
  const carregar = async () => {
    const res = await api.get('/utilizadores')
    setUsers(res.data)
  }
  useEffect(() => {
    carregar()
  }, [])
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
              className="bg-surface p-3 rounded shadow flex justify-between items-center"
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
  const carregar = async () => {
    const res = await api.get('/candidaturas')
    setCands(res.data)
  }
  useEffect(() => {
    carregar()
  }, [])
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
      if (!(c.bolsa?.titulo?.toLowerCase().includes(p) || c.user?.nome?.toLowerCase().includes(p)))
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
            <div key={c.id} className="bg-surface p-3 rounded shadow">
              <div className="flex justify-between mb-2">
                <div>
                  <div className="font-medium">
                    {c.user?.nome} ({c.user?.email}) - {c.bolsa?.titulo}
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
  const carregar = async () => {
    const res = await api.get('/mentorias')
    setMentorias(res.data)
  }
  useEffect(() => {
    carregar()
  }, [])
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
            <div key={m.id} className="bg-surface p-3 rounded shadow">
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
      <div className="flex gap-4 mb-6 flex-wrap">
        <Link to="/admin" className="rounded-xl bg-brand px-4 py-2 text-bg">
          {t('nav:scholarships')}
        </Link>
        <Link to="/admin/utilizadores" className="rounded-xl bg-bg px-4 py-2">
          {t('admin:users')}
        </Link>
        <Link to="/admin/candidaturas" className="rounded-xl bg-bg px-4 py-2">
          {t('admin:applications')}
        </Link>
        <Link to="/admin/mentorias" className="rounded-xl bg-bg px-4 py-2">
          {t('admin:mentoring')}
        </Link>
      </div>
      <Routes>
        <Route path="/" element={<BolsasAdmin />} />
        <Route path="/utilizadores" element={<UtilizadoresAdmin />} />
        <Route path="/candidaturas" element={<CandidaturasAdmin />} />
        <Route path="/mentorias" element={<MentoriasAdmin />} />
      </Routes>
    </div>
  )
}
