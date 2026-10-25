import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { localeFor } from '../i18n'
import { traduzirErro, traduzirEstado } from '../services/traduzirErro'

export default function BolsaDetalhe() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation(['scholarships', 'common'])
  const [bolsa, setBolsa] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await api.get(`/bolsas/${id}`)
        setBolsa(res.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [id])

  const candidatar = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/bolsas/${id}` }, mensagem: t('scholarships:loginToApply') } })
      return
    }
    setErro(''); setSucesso('')
    try {
      await api.post(`/candidaturas/bolsa/${id}`, { mensagem })
      setSucesso(t('scholarships:sent'))
    } catch (err) {
      setErro(traduzirErro(err))
    }
  }

  if (loading) return <div className="p-8 text-center">{t('common:loading')}</div>
  if (!bolsa) return <div className="p-8 text-center">{t('scholarships:notFound')}</div>

  const prazoPassado = bolsa.dataLimite ? new Date(bolsa.dataLimite) < new Date() : false
  const podeCandidatar = bolsa.status === 'ABERTA' && !prazoPassado

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-surface p-6 rounded shadow">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">{bolsa.titulo}</h1>
          <span className={`text-xs px-2 py-1 rounded-full h-fit ${bolsa.status === 'ABERTA' && !prazoPassado ? 'bg-accent/10 text-accent' : 'bg-bg text-muted'}`}>{prazoPassado ? t('scholarships:expired') : traduzirEstado(bolsa.status)}</span>
        </div>
        <p className="text-muted mb-4">{bolsa.entidade} • {bolsa.area}</p>
        <div className="space-y-4 mb-6">
          <div><h2 className="font-semibold">{t('common:description')}</h2><p className="text-text whitespace-pre-wrap">{bolsa.descricao}</p></div>
          {bolsa.requisitos && <div><h2 className="font-semibold">{t('common:requirements')}</h2><p className="text-text whitespace-pre-wrap">{bolsa.requisitos}</p></div>}
          {bolsa.valor && <div><h2 className="font-semibold">{t('common:amount')}</h2><p className="text-text">{bolsa.valor}</p></div>}
          <div><h2 className="font-semibold">{t('common:deadline')}</h2><p className="text-text">{new Date(bolsa.dataLimite).toLocaleDateString(localeFor(i18n.language))}</p></div>
        </div>
        {podeCandidatar && (
          <div className="border-t pt-4">
            <h2 className="font-semibold mb-2">{t('scholarships:apply')}</h2>
            {erro && <div className="mb-3 p-3 bg-danger/10 text-danger rounded">{erro}</div>}
            {sucesso && <div className="mb-3 p-3 bg-accent/10 text-accent rounded">{sucesso}</div>}
            {user?.role === 'ESTUDANTE' ? (
              <div className="space-y-3">
                <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder={t('scholarships:applyMessage')} className="w-full rounded-xl border border-border px-3 py-2" rows={3}></textarea>
                <button onClick={candidatar} className="rounded-xl bg-brand px-4 py-2 text-bg hover:bg-brand/90">{t('scholarships:applySend')}</button>
              </div>
            ) : user ? (
              <p className="text-muted">{t('scholarships:studentsOnly')}</p>
            ) : (
              <p className="text-muted">{t('scholarships:loginToApply')}</p>
            )}
          </div>
        )}
        {prazoPassado && <p className="mt-4 text-danger">{t('scholarships:expiredMessage')}</p>}
      </div>
    </div>
  )
}
