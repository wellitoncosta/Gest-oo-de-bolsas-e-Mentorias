import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { localeFor } from '../i18n'
import { traduzirErro } from '../services/traduzirErro'

export default function MentorDetalhe() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['mentoring', 'common'])
  const [mentor, setMentor] = useState(null)
  const [disps, setDisps] = useState([])
  const [tema, setTema] = useState('')
  const [sel, setSel] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      try {
        const [m, d] = await Promise.all([
          api.get(`/mentorias/mentores/${id}`),
          api.get(`/mentorias/disponibilidades?mentorId=${id}`)
        ])
        setMentor(m.data)
        setDisps(d.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [id])

  const agendar = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/mentores/${id}` }, mensagem: t('mentoring:loginToBook') } })
      return
    }
    if (!sel || !tema) { setErro(t('mentoring:selectSlot')); return }
    setErro(''); setSucesso('')
    try {
      await api.post('/mentorias/agendar', { disponibilidadeId: sel, tema })
      setSucesso(t('mentoring:requestSent'))
    } catch (err) {
      setErro(traduzirErro(err))
    }
  }

  if (loading) return <div className="p-8 text-center">{t('common:loading')}</div>
  if (!mentor) return <div className="p-8 text-center">{t('mentoring:notFound')}</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-surface p-6 rounded shadow mb-6">
        <h1 className="text-2xl font-bold mb-2">{mentor.nome}</h1>
        {mentor.area && <p className="text-muted mb-2">{mentor.area}</p>}
        {mentor.biografia && <p className="text-text">{mentor.biografia}</p>}
      </div>
      <div className="bg-surface p-6 rounded shadow">
        <h2 className="font-bold text-lg mb-4">{t('mentoring:availability')}</h2>
        {erro && <div className="mb-3 p-3 bg-danger/10 text-danger rounded">{erro}</div>}
        {sucesso && <div className="mb-3 p-3 bg-accent/10 text-accent rounded">{sucesso}</div>}
        {disps.length === 0 ? <p className="text-muted">{t('mentoring:noAvailability')}</p> : (
          <div className="space-y-3">
            {disps.map(d => (
              <label key={d.id} className="flex items-center gap-3 border p-3 rounded cursor-pointer">
                <input type="radio" name="disp" value={d.id} onChange={(e) => setSel(e.target.value)} />
                <div><div className="font-medium">{new Date(d.data).toLocaleDateString(localeFor(i18n.language))} • {d.horaInicio} - {d.horaFim}</div></div>
              </label>
            ))}
          </div>
        )}
        {user?.role === 'ESTUDANTE' && disps.length > 0 && (
          <div className="mt-4 space-y-3">
            <input value={tema} onChange={(e) => setTema(e.target.value)} placeholder={t('mentoring:topic')} className="w-full rounded-xl border border-border px-3 py-2" />
            <button onClick={agendar} className="rounded-xl bg-brand px-4 py-2 text-bg hover:bg-brand/90">{t('mentoring:book')}</button>
          </div>
        )}
        {!user && disps.length > 0 && <p className="mt-3 text-muted">{t('mentoring:loginToBook')}</p>}
      </div>
    </div>
  )
}
