import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { traduzirErro, traduzirEstado } from '../services/traduzirErro'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import { aUTC, formatarDataHora, formatarHora, fusoDoNavegador } from '../services/datas'

export default function Mentorias() {
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const { t, i18n } = useTranslation(['mentoring', 'dashboard', 'common'])
  const [mentorias, setMentorias] = useState([])
  const [horarios, setHorarios] = useState([])
  const [form, setForm] = useState({ data: '', horaInicio: '', horaFim: '' })
  const [loading, setLoading] = useState(true)

  const carregar = async () => {
    try {
      const res = await api.get('/mentorias/minhas')
      setMentorias(res.data)
      if (user?.role === 'MENTOR') {
        const h = await api.get('/mentorias/minhas-disponibilidades')
        setHorarios(h.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [user])

  const atualizar = async (id, status) => {
    try {
      await api.put(`/mentorias/${id}/estado`, { status })
      carregar()
    } catch (e) {
      toast.error(traduzirErro(e))
    }
  }

  const criarHorario = async (e) => {
    e.preventDefault()
    try {
      const fuso = user?.fusoHorario || fusoDoNavegador()
      await api.post('/mentorias/disponibilidades', {
        inicio: aUTC(form.data, form.horaInicio, fuso),
        fim: aUTC(form.data, form.horaFim, fuso),
      })
      setForm({ data: '', horaInicio: '', horaFim: '' })
      carregar()
      toast.success(t('mentoring:slotCreated'))
    } catch (err) {
      toast.error(traduzirErro(err))
    }
  }

  const removerHorario = async (id) => {
    if (!(await confirm({ message: t('mentoring:removeSlotConfirm') }))) return
    try {
      await api.delete(`/mentorias/disponibilidades/${id}`)
      carregar()
      toast.success(t('mentoring:slotRemoved'))
    } catch (err) {
      toast.error(traduzirErro(err))
    }
  }

  if (loading)
    return (
      <div className="mx-auto grid max-w-content gap-4 px-5 py-12">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-48" />
        <Skeleton className="h-40" />
      </div>
    )

  return (
    <div className="max-w-content mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('mentoring:title')}</h1>

      {user?.role === 'MENTOR' && (
        <div className="mb-8">
          <h2 className="font-bold text-xl mb-4">{t('mentoring:mySlots')}</h2>
          <form
            onSubmit={criarHorario}
            className="bg-surface p-4 rounded shadow mb-4 grid md:grid-cols-4 gap-3"
          >
            <input
              type="date"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="time"
              value={form.horaInicio}
              onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="time"
              value={form.horaFim}
              onChange={(e) => setForm({ ...form, horaFim: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <button className="rounded-xl bg-brand px-4 py-2 text-bg">
              {t('mentoring:createSlot')}
            </button>
          </form>
          <div className="space-y-2">
            {horarios.map((h) => (
              <div
                key={h.id}
                className="bg-surface p-3 rounded shadow flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">
                    {formatarDataHora(
                      h.inicio,
                      i18n.language,
                      user?.fusoHorario || fusoDoNavegador(),
                    )}{' '}
                    – {formatarHora(h.fim, i18n.language, user?.fusoHorario || fusoDoNavegador())}
                  </div>
                  <div className="text-sm text-muted">
                    {h.status === 'LIVRE'
                      ? t('mentoring:free')
                      : t('mentoring:occupied', { name: h.estudanteNome })}
                  </div>
                </div>
                <button
                  onClick={() => removerHorario(h.id)}
                  disabled={h.status === 'OCUPADO'}
                  className={`rounded-lg px-3 py-1 text-sm ${h.status === 'OCUPADO' ? 'bg-bg text-muted' : 'bg-danger text-bg'}`}
                >
                  {t('common:remove')}
                </button>
              </div>
            ))}
            {horarios.length === 0 && <EmptyState title={t('mentoring:noSlots')} />}
          </div>
        </div>
      )}

      <h2 className="font-bold text-xl mb-4">{t('mentoring:title')}</h2>
      {mentorias.length === 0 ? (
        <EmptyState title={t('dashboard:noneMentoring')} />
      ) : (
        <div className="space-y-3">
          {mentorias.map((m) => (
            <div key={m.id} className="bg-surface p-4 rounded shadow">
              <div className="flex justify-between mb-2">
                <div>
                  <div className="font-bold">{m.tema}</div>
                  <div className="text-sm text-muted">
                    {user.role === 'MENTOR'
                      ? `${t('common:student')}: ${m.estudante.nome}`
                      : `${t('common:mentor')}: ${m.mentor.nome}`}
                  </div>
                  {m.disponibilidade && (
                    <div className="text-sm text-muted">
                      {formatarDataHora(
                        m.disponibilidade.inicio,
                        i18n.language,
                        user?.fusoHorario || fusoDoNavegador(),
                      )}{' '}
                      –{' '}
                      {formatarHora(
                        m.disponibilidade.fim,
                        i18n.language,
                        user?.fusoHorario || fusoDoNavegador(),
                      )}
                    </div>
                  )}
                  {m.status === 'CONFIRMADA' && m.linkReuniao && (
                    <a
                      className="mt-2 inline-flex text-sm font-semibold text-brand underline dark:text-accent"
                      href={m.linkReuniao}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('mentoring:joinMeeting')}
                    </a>
                  )}
                </div>
                <Badge className="h-fit">{traduzirEstado(m.status)}</Badge>
              </div>
              <div className="flex gap-2 mt-3">
                {user.role === 'MENTOR' && m.status === 'PENDENTE' && (
                  <>
                    <button
                      onClick={() => atualizar(m.id, 'CONFIRMADA')}
                      className="rounded-lg bg-accent px-3 py-1 text-sm text-bg"
                    >
                      {t('mentoring:confirm')}
                    </button>
                    <button
                      onClick={() => atualizar(m.id, 'RECUSADA')}
                      className="rounded-lg bg-danger px-3 py-1 text-sm text-bg"
                    >
                      {t('mentoring:decline')}
                    </button>
                    <button
                      onClick={() => atualizar(m.id, 'CANCELADA')}
                      className="rounded-lg bg-brand px-3 py-1 text-sm text-bg"
                    >
                      {t('mentoring:cancel')}
                    </button>
                  </>
                )}
                {user.role === 'MENTOR' && m.status === 'CONFIRMADA' && (
                  <>
                    <button
                      onClick={() => atualizar(m.id, 'CONCLUIDA')}
                      className="rounded-lg bg-brand px-3 py-1 text-sm text-bg"
                    >
                      {t('mentoring:complete')}
                    </button>
                    <button
                      onClick={() => atualizar(m.id, 'CANCELADA')}
                      className="rounded-lg bg-brand px-3 py-1 text-sm text-bg"
                    >
                      {t('mentoring:cancel')}
                    </button>
                  </>
                )}
                {user.role === 'ESTUDANTE' &&
                  (m.status === 'PENDENTE' || m.status === 'CONFIRMADA') && (
                    <button
                      onClick={() => atualizar(m.id, 'CANCELADA')}
                      className="rounded-lg bg-brand px-3 py-1 text-sm text-bg"
                    >
                      {t('mentoring:cancel')}
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
