import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { traduzirErro, traduzirEstado } from '../services/traduzirErro'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import { Star } from 'lucide-react'
import { aUTC, formatarDataHora, formatarHora, fusoDoNavegador } from '../services/datas'
import { useRealtime } from '../context/RealtimeContext'

export default function Mentorias({ section }) {
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const { t, i18n } = useTranslation(['mentoring', 'dashboard', 'common'])
  const [mentorias, setMentorias] = useState([])
  const [horarios, setHorarios] = useState([])
  const [form, setForm] = useState({ data: '', horaInicio: '', horaFim: '' })
  const [duracao, setDuracao] = useState(45)
  const [repetirSemanas, setRepetirSemanas] = useState(0)
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [filtroSessao, setFiltroSessao] = useState('proximas')
  const [loading, setLoading] = useState(true)
  const [avaliacoes, setAvaliacoes] = useState({})
  const fuso = user?.fusoHorario || fusoDoNavegador()

  const carregar = useCallback(async () => {
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
  }, [user])

  useEffect(() => {
    carregar()
  }, [carregar])
  useRealtime(['mentoria:nova', 'mentoria:estado', 'disponibilidade:alterada'], ({ evento }) => {
    carregar()
    if (evento === 'mentoria:nova') toast.success(t('mentoring:newRequest'))
    if (evento === 'mentoria:estado') toast.success(t('mentoring:statusUpdated'))
  })

  const atualizar = async (id, status, reabrirHorario) => {
    try {
      await api.put(`/mentorias/${id}/estado`, {
        status,
        ...(reabrirHorario === undefined ? {} : { reabrirHorario }),
      })
      carregar()
    } catch (e) {
      toast.error(traduzirErro(e))
    }
  }

  const cancelarMentoria = async (id) => {
    if (user?.role !== 'MENTOR') {
      const aceite = await confirm({
        title: t('mentoring:cancel'),
        message: t('mentoring:cancelSessionConfirm'),
        confirmLabel: t('mentoring:cancel'),
      })
      if (aceite) await atualizar(id, 'CANCELADA')
      return
    }
    const escolha = await confirm({
      title: t('mentoring:cancel'),
      message: t('mentoring:reopenSlotPrompt'),
      cancelLabel: t('mentoring:back'),
      choices: [
        { value: true, label: t('mentoring:reopenSlot') },
        { value: false, label: t('mentoring:closeSlot') },
      ],
    })
    if (escolha !== null) await atualizar(id, 'CANCELADA', escolha)
  }

  const criarHorario = async (e) => {
    e.preventDefault()
    try {
      const fuso = user?.fusoHorario || fusoDoNavegador()
      const inicios = Array.from(
        { length: Math.max(1, Number(repetirSemanas) + 1) },
        (_, semana) => {
          const date = new Date(`${form.data}T12:00:00`)
          date.setDate(date.getDate() + semana * 7)
          const data = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          const start = aUTC(data, form.horaInicio, fuso)
          return {
            inicio: start,
            fim: new Date(new Date(start).getTime() + Number(duracao) * 60000).toISOString(),
          }
        },
      )
      const existeSobreposicao = inicios.some((item) =>
        horarios.some(
          (h) =>
            h.ativa &&
            new Date(h.inicio) < new Date(item.fim) &&
            new Date(h.fim) > new Date(item.inicio),
        ),
      )
      if (existeSobreposicao) {
        toast.error(t('mentoring:overlapWarning'))
        return
      }
      for (const item of inicios) await api.post('/mentorias/disponibilidades', item)
      setForm({ data: '', horaInicio: '', horaFim: '' })
      setRepetirSemanas(0)
      carregar()
      toast.success(t('mentoring:slotCreated'))
    } catch (err) {
      toast.error(traduzirErro(err))
    }
  }

  const removerHorario = async (id) => {
    if (!(await confirm({ message: t('mentoring:removeSlotConfirm') }))) return
    try {
      const response = await api.delete(`/mentorias/disponibilidades/${id}`)
      carregar()
      toast.success(
        t(
          response.data.codigo === 'DISPONIBILIDADE_FECHADA'
            ? 'mentoring:slotClosed'
            : 'mentoring:slotRemoved',
        ),
      )
    } catch (err) {
      toast.error(traduzirErro(err))
    }
  }

  const avaliar = async (mentoria) => {
    const valor = avaliacoes[mentoria.id] || {
      nota: mentoria.avaliacao || 5,
      comentario: mentoria.comentarioAvaliacao || '',
    }
    try {
      await api.put(`/mentorias/${mentoria.id}/avaliacao`, {
        avaliacao: Number(valor.nota),
        comentarioAvaliacao: valor.comentario,
      })
      toast.success(t('mentoring:ratingSaved'))
      carregar()
    } catch (err) {
      toast.error(traduzirErro(err))
    }
  }

  const sessoesFiltradas = mentorias.filter((mentoria) => {
    const cancelada = ['CANCELADA', 'RECUSADA'].includes(mentoria.status)
    const passada =
      mentoria.status === 'CONCLUIDA' ||
      (mentoria.disponibilidade?.fim && new Date(mentoria.disponibilidade.fim) < new Date())
    return filtroSessao === 'canceladas'
      ? cancelada
      : filtroSessao === 'passadas'
        ? passada && !cancelada
        : !passada && !cancelada
  })

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

      {user?.role === 'MENTOR' && section !== 'sessoes' && (
        <div className="mb-8">
          <h2 className="font-bold text-xl mb-4">{t('mentoring:mySlots')}</h2>
          <form
            id="form-horario"
            onSubmit={criarHorario}
            className="bg-surface p-4 rounded shadow mb-4 grid md:grid-cols-5 gap-3"
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
            <select
              value={duracao}
              onChange={(e) => setDuracao(Number(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {[30, 45, 60].map((min) => (
                <option key={min} value={min}>
                  {min} min
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              {t('mentoring:repeatWeeks')}
              <input
                type="number"
                min="0"
                max="12"
                value={repetirSemanas}
                onChange={(e) => setRepetirSemanas(e.target.value)}
                className="w-16 border rounded px-2 py-2"
              />
            </label>
            <button className="rounded-xl bg-brand px-4 py-2 text-bg">
              {repetirSemanas ? t('mentoring:createMultiple') : t('mentoring:createSlot')}
            </button>
          </form>
          {form.data && form.horaInicio && (
            <p className="mb-4 text-sm text-muted">
              {t('mentoring:timezone')}: {user?.fusoHorario || fusoDoNavegador()}
            </p>
          )}
          <section className="mb-6 rounded-2xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{t('mentoring:weekSchedule')}</h3>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border border-border px-3 py-1"
                  onClick={() => setSemanaOffset((value) => value - 1)}
                >
                  ‹
                </button>
                <button
                  className="rounded-lg border border-border px-3 py-1"
                  onClick={() => setSemanaOffset((value) => value + 1)}
                >
                  ›
                </button>
              </div>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="grid min-w-[980px] grid-cols-7 gap-2">
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const partesHoje = Object.fromEntries(
                    new Intl.DateTimeFormat('en-CA', {
                      timeZone: fuso,
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })
                      .formatToParts(new Date())
                      .map(({ type, value }) => [type, value]),
                  )
                  const hojeUTC = new Date(
                    Date.UTC(
                      Number(partesHoje.year),
                      Number(partesHoje.month) - 1,
                      Number(partesHoje.day),
                    ),
                  )
                  const mondayOffset = (hojeUTC.getUTCDay() + 6) % 7
                  const diaUTC = new Date(
                    hojeUTC.getTime() + (dayIndex - mondayOffset + semanaOffset * 7) * 86400000,
                  )
                  const dateKey = `${diaUTC.getUTCFullYear()}-${String(diaUTC.getUTCMonth() + 1).padStart(2, '0')}-${String(diaUTC.getUTCDate()).padStart(2, '0')}`
                  const dataDoDia = new Date(`${dateKey}T12:00:00Z`)
                  const daySlots = horarios.filter(
                    (h) =>
                      h.ativa &&
                      new Intl.DateTimeFormat('en-CA', {
                        timeZone: fuso,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      }).format(new Date(h.inicio)) === dateKey,
                  )
                  return (
                    <div key={dateKey} className="min-h-40 min-w-0 rounded-xl bg-bg/60 p-2">
                      <p className="mb-2 text-xs font-semibold text-muted">
                        {dataDoDia.toLocaleDateString(i18n.language, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          timeZone: 'UTC',
                        })}
                      </p>
                      {Array.from({ length: 12 }, (_, hourIndex) => hourIndex + 8).map((hour) => {
                        const hh = String(hour).padStart(2, '0')
                        const slot = daySlots.find(
                          (h) =>
                            new Intl.DateTimeFormat('en-GB', {
                              timeZone: fuso,
                              hour: '2-digit',
                              minute: '2-digit',
                              hourCycle: 'h23',
                            }).format(new Date(h.inicio)) === `${hh}:00`,
                        )
                        return (
                          <button
                            key={hour}
                            title={
                              slot
                                ? slot.status === 'OCUPADO'
                                  ? `${slot.estudanteNome} · ${slot.tema || ''}`
                                  : t('mentoring:free')
                                : t('mentoring:createSlot')
                            }
                            onClick={() => {
                              if (slot) return
                              setDuracao(45)
                              setForm({
                                data: dateKey,
                                horaInicio: `${hh}:00`,
                                horaFim: '',
                              })
                              document
                                .getElementById('form-horario')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }}
                            className={`mb-1 block w-full truncate rounded px-1.5 py-1.5 text-left text-xs ${slot?.status === 'OCUPADO' ? 'bg-amber-500/20 text-text' : slot ? 'bg-accent/20 text-text' : 'text-muted hover:bg-brand/10'}`}
                          >
                            {hh}:00
                            {slot
                              ? ` · ${slot.status === 'OCUPADO' ? slot.estudanteNome : t('mentoring:free')}`
                              : ' · +'}
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
          {['ativa', 'historico'].map((grupo) => {
            const lista = horarios.filter((h) => (grupo === 'ativa' ? h.ativa : !h.ativa))
            if (!lista.length) return null
            return (
              <section key={grupo} className="mb-5">
                <h3 className="mb-2 font-semibold">
                  {t(grupo === 'ativa' ? 'mentoring:activeSlots' : 'mentoring:slotHistory')}
                </h3>
                <div className="space-y-2">
                  {lista.map((h) => (
                    <div
                      key={h.id}
                      className="animate-fade-in bg-surface p-3 rounded shadow flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium">
                          {formatarDataHora(
                            h.inicio,
                            i18n.language,
                            user?.fusoHorario || fusoDoNavegador(),
                          )}{' '}
                          –{' '}
                          {formatarHora(
                            h.fim,
                            i18n.language,
                            user?.fusoHorario || fusoDoNavegador(),
                          )}
                        </div>
                        <div className="text-sm text-muted">
                          {h.status === 'LIVRE'
                            ? t('mentoring:free')
                            : h.status === 'FECHADO'
                              ? t('mentoring:slotInactive')
                              : t('mentoring:occupied', { name: h.estudanteNome })}
                        </div>
                      </div>
                      <span
                        title={
                          h.status === 'OCUPADO' ? t('mentoring:cancelSessionFirst') : undefined
                        }
                      >
                        <button
                          onClick={() => removerHorario(h.id)}
                          disabled={!h.ativa || h.status === 'OCUPADO'}
                          className={`rounded-lg px-3 py-1 text-sm ${!h.ativa || h.status === 'OCUPADO' ? 'bg-bg text-muted' : 'bg-danger text-bg'}`}
                        >
                          {h.temHistorico ? t('mentoring:closeSlot') : t('common:remove')}
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
          {horarios.length === 0 && <EmptyState title={t('mentoring:noSlots')} />}
        </div>
      )}

      {section !== 'horarios' && (
        <>
          <h2 className="font-bold text-xl mb-4">{t('mentoring:mySessions')}</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {['proximas', 'passadas', 'canceladas'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFiltroSessao(filter)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${filtroSessao === filter ? 'bg-brand text-bg' : 'bg-surface text-muted'}`}
              >
                {t(`mentoring:${filter}`)}
              </button>
            ))}
          </div>
          {sessoesFiltradas.length === 0 ? (
            <EmptyState title={t('dashboard:noneMentoring')} />
          ) : (
            <div className="space-y-3">
              {sessoesFiltradas.map((m) => (
                <div key={m.id} className="animate-fade-in bg-surface p-4 rounded shadow">
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
                          onClick={() => cancelarMentoria(m.id)}
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
                          onClick={() => cancelarMentoria(m.id)}
                          className="rounded-lg bg-brand px-3 py-1 text-sm text-bg"
                        >
                          {t('mentoring:cancel')}
                        </button>
                      </>
                    )}
                    {user.role === 'ESTUDANTE' &&
                      (m.status === 'PENDENTE' || m.status === 'CONFIRMADA') && (
                        <button
                          onClick={() => cancelarMentoria(m.id)}
                          className="rounded-lg bg-brand px-3 py-1 text-sm text-bg"
                        >
                          {t('mentoring:cancel')}
                        </button>
                      )}
                  </div>
                  {user.role === 'ESTUDANTE' && m.status === 'CONCLUIDA' && (
                    <div className="mt-4 grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[auto_1fr_auto] sm:items-end">
                      <label className="text-sm font-medium">
                        {t('mentoring:rating')}
                        <div
                          className="mt-1 flex items-center gap-1"
                          role="radiogroup"
                          aria-label={t('mentoring:rating')}
                        >
                          {[1, 2, 3, 4, 5].map((nota) => {
                            const selecionada = Number(avaliacoes[m.id]?.nota ?? m.avaliacao ?? 5)
                            return (
                              <button
                                key={nota}
                                type="button"
                                role="radio"
                                aria-checked={selecionada === nota}
                                aria-label={`${nota} / 5`}
                                title={`${nota} / 5`}
                                onClick={() =>
                                  setAvaliacoes((old) => ({
                                    ...old,
                                    [m.id]: { ...old[m.id], nota },
                                  }))
                                }
                                className="rounded p-1 text-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                              >
                                <Star
                                  size={22}
                                  fill={nota <= selecionada ? 'currentColor' : 'none'}
                                />
                              </button>
                            )
                          })}
                          <span className="ml-2 text-sm text-muted">
                            {avaliacoes[m.id]?.nota ?? m.avaliacao ?? 5} / 5
                          </span>
                        </div>
                      </label>
                      <label className="text-sm font-medium">
                        {t('mentoring:ratingComment')}
                        <input
                          value={avaliacoes[m.id]?.comentario ?? m.comentarioAvaliacao ?? ''}
                          onChange={(event) =>
                            setAvaliacoes((old) => ({
                              ...old,
                              [m.id]: { ...old[m.id], comentario: event.target.value },
                            }))
                          }
                          maxLength={1000}
                          className="mt-1 block w-full rounded-lg border border-border bg-bg px-3 py-2"
                        />
                      </label>
                      <button
                        onClick={() => avaliar(m)}
                        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg"
                      >
                        {t('mentoring:saveRating')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
