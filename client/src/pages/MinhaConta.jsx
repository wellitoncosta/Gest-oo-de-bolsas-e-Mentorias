import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { traduzirErro } from '../services/traduzirErro'

export default function MinhaConta() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation(['account', 'common'])
  const [perfil, setPerfil] = useState(null)
  const [form, setForm] = useState({})
  const [senha, setSenha] = useState({ atual: '', nova: '' })
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    const carregar = async () => {
      const res = await api.get('/conta')
      setPerfil(res.data)
      setForm(res.data)
    }
    carregar()
  }, [])

  const guardar = async (e) => {
    e.preventDefault()
    setErro(''); setMsg('')
    try {
      const res = await api.put('/conta', form)
      setPerfil(res.data)
      setMsg(t('account:updated'))
    } catch (err) {
      setErro(traduzirErro(err))
    }
  }

  const alterar = async (e) => {
    e.preventDefault()
    setErro(''); setMsg('')
    try {
      const res = await api.put('/conta/senha', senha)
      setMsg(res.data.mensagem)
      setSenha({ atual: '', nova: '' })
    } catch (err) {
      setErro(traduzirErro(err))
    }
  }

  const apagar = async () => {
    const senha = prompt(t('account:deletePrompt'))
    if (!senha) return
    if (!confirm(t('account:deleteConfirm'))) return
    try {
      await api.delete('/conta', { data: { senha } })
      await logout()
      navigate('/')
    } catch (err) {
      setErro(traduzirErro(err))
    }
  }

  if (!perfil) return <div className="p-8 text-center">{t('common:loading')}</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('account:title')}</h1>
      {msg && <div className="mb-4 p-3 bg-accent/10 text-accent rounded">{msg}</div>}
      {erro && <div className="mb-4 p-3 bg-danger/10 text-danger rounded">{erro}</div>}
      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={guardar} className="bg-surface p-4 rounded shadow space-y-3">
          <h2 className="font-bold">{t('account:profile')}</h2>
          <div><label className="block text-sm">{t('common:name')}</label><input value={form.nome || ''} onChange={(e) => setForm({...form, nome: e.target.value})} className="w-full rounded-xl border border-border px-3 py-2" /></div>
          <div><label className="block text-sm">{t('common:phone')}</label><input value={form.telefone || ''} onChange={(e) => setForm({...form, telefone: e.target.value})} className="w-full rounded-xl border border-border px-3 py-2" /></div>
          <div><label className="block text-sm">{t('common:area')}</label><input value={form.area || ''} onChange={(e) => setForm({...form, area: e.target.value})} className="w-full rounded-xl border border-border px-3 py-2" /></div>
          <div><label className="block text-sm">{t('common:organization')}</label><input value={form.instituicao || ''} onChange={(e) => setForm({...form, instituicao: e.target.value})} className="w-full rounded-xl border border-border px-3 py-2" /></div>
          <div><label className="block text-sm">{t('common:bio')}</label><textarea value={form.biografia || ''} onChange={(e) => setForm({...form, biografia: e.target.value})} className="w-full rounded-xl border border-border px-3 py-2" rows={3}></textarea></div>
          <button className="rounded-xl bg-brand px-4 py-2 text-bg">{t('common:save')}</button>
        </form>
        <div className="space-y-6">
          <form onSubmit={alterar} className="bg-surface p-4 rounded shadow space-y-3">
            <h2 className="font-bold">{t('account:changePassword')}</h2>
            <div><label className="block text-sm">{t('account:currentPassword')}</label><input type="password" value={senha.atual} onChange={(e) => setSenha({...senha, atual: e.target.value})} className="w-full rounded-xl border border-border px-3 py-2" /></div>
            <div><label className="block text-sm">{t('auth:newPassword')}</label><input type="password" value={senha.nova} onChange={(e) => setSenha({...senha, nova: e.target.value})} className="w-full rounded-xl border border-border px-3 py-2" /></div>
            <button className="rounded-xl bg-brand px-4 py-2 text-bg">{t('account:changePassword')}</button>
          </form>
          <div className="bg-surface p-4 rounded shadow">
            <h2 className="mb-2 font-bold text-danger">{t('account:dangerZone')}</h2>
            <button onClick={apagar} className="rounded-xl bg-danger px-4 py-2 text-bg">{t('account:delete')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
