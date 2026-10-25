import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import AuthControls from '../components/AuthControls'
import Button from '../components/ui/Button'
import { Input, Select } from '../components/ui/Field'
import { fusoDoNavegador } from '../services/datas'

export default function Registo() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'ESTUDANTE',
    fusoHorario: fusoDoNavegador(),
  })
  const [erro, setErro] = useState('')
  const { registar } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation(['auth', 'common'])
  const update = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }))
  const submeter = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      await registar(form)
      navigate('/dashboard')
    } catch (err) {
      const code = err.response?.data?.codigo
      setErro(code ? t(`errors:${code}`) : err.response?.data?.mensagem || t('auth:registerError'))
    }
  }
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-bg px-4 py-20">
      <AuthControls />
      <div className="pointer-events-none absolute -left-24 top-20 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      <div className="animate-fade-in relative w-full max-w-md">
        <div className="mb-7 text-center">
          <Link to="/" className="mx-auto mb-4 inline-flex">
            <img
              src="/logos/icon-light.png"
              alt="B&M"
              className="h-24 w-24 object-contain dark:hidden"
            />
            <img
              src="/logos/icon-dark.png"
              alt="B&M"
              className="hidden h-24 w-24 object-contain dark:block"
            />
          </Link>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[.16em] text-accent">
            B&amp;M
          </p>
          <h1 className="text-3xl font-semibold text-text">{t('auth:registerTitle')}</h1>
        </div>
        <form
          onSubmit={submeter}
          className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-brand/5 sm:p-8"
        >
          {erro && (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
            >
              {erro}
            </div>
          )}
          <Input
            label={t('common:name')}
            value={form.nome}
            onChange={update('nome')}
            autoComplete="name"
            required
          />
          <Input
            type="email"
            label={t('common:email')}
            value={form.email}
            onChange={update('email')}
            autoComplete="email"
            required
          />
          <Input
            type="password"
            label={t('common:password')}
            value={form.senha}
            onChange={update('senha')}
            autoComplete="new-password"
            required
          />
          <Select label={t('auth:role')} value={form.role} onChange={update('role')}>
            <option value="ESTUDANTE">{t('common:student')}</option>
            <option value="MENTOR">{t('common:mentor')}</option>
          </Select>
          <Button className="w-full py-3">{t('auth:register')}</Button>
        </form>
        <div className="mt-5 text-center text-sm">
          <Link to="/login" className="font-medium text-brand hover:text-accent">
            {t('auth:alreadyHaveAccount')}
          </Link>
        </div>
      </div>
    </div>
  )
}
