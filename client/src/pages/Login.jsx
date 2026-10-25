import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import AuthControls from '../components/AuthControls'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Field'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation(['auth', 'common'])
  const mensagem = location.state?.mensagem
  const submeter = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      await login(email, senha)
      navigate(location.state?.from?.pathname || '/dashboard')
    } catch (err) {
      const code = err.response?.data?.codigo
      setErro(code ? t(`errors:${code}`) : err.response?.data?.mensagem || t('auth:loginError'))
    }
  }
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-bg px-4 py-20">
      <AuthControls />
      <div className="pointer-events-none absolute -left-24 top-20 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      <div className="animate-fade-in relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="mx-auto mb-5 inline-flex">
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
          <h1 className="text-3xl font-semibold text-text">{t('auth:loginTitle')}</h1>
        </div>
        <form
          onSubmit={submeter}
          className="space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-brand/5 sm:p-8"
        >
          {mensagem && (
            <div className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm text-text">
              {mensagem}
            </div>
          )}
          {erro && (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
            >
              {erro}
            </div>
          )}
          <Input
            type="email"
            label={t('common:email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            type="password"
            label={t('common:password')}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Button className="w-full py-3">{t('auth:login')}</Button>
        </form>
        <div className="mt-5 flex justify-between gap-3 text-sm">
          <Link to="/registo" className="font-medium text-brand hover:text-accent">
            {t('auth:createAccount')}
          </Link>
          <Link to="/recuperacao" className="text-muted hover:text-text">
            {t('auth:recoverPassword')}
          </Link>
        </div>
      </div>
    </div>
  )
}
