import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import AuthControls from '../components/AuthControls'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { traduzirErro } from '../services/traduzirErro'

export default function Recuperacao() {
  const [passo, setPasso] = useState(1),
    [email, setEmail] = useState(''),
    [codigo, setCodigo] = useState('')
  const [novaSenha, setNovaSenha] = useState(''),
    [confirmar, setConfirmar] = useState(''),
    [mostrar, setMostrar] = useState(false)
  const [msg, setMsg] = useState(''),
    [erro, setErro] = useState(''),
    [contador, setContador] = useState(0)
  const [loadingPedir, setLoadingPedir] = useState(false),
    [loadingValidar, setLoadingValidar] = useState(false),
    [loadingRedefinir, setLoadingRedefinir] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const navigate = useNavigate()
  const { t } = useTranslation(['auth', 'common'])

  useEffect(() => {
    if (contador <= 0) return
    const timer = setInterval(() => setContador((value) => value - 1), 1000)
    return () => clearInterval(timer)
  }, [contador])
  const pedir = async (e) => {
    e.preventDefault()
    if (loadingPedir) return
    setErro('')
    setMsg('')
    setLoadingPedir(true)
    try {
      const res = await api.post('/auth/recuperacao/pedir', { email })
      setMsg(t('auth:codeSent'))
      setPasso(2)
      setContador(res.data.segundosReenvio || 60)
    } catch (err) {
      setErro(traduzirErro(err))
    } finally {
      setLoadingPedir(false)
    }
  }
  const reenviar = async () => {
    if (contador > 0 || loadingPedir) return
    setErro('')
    setMsg('')
    setLoadingPedir(true)
    try {
      const res = await api.post('/auth/recuperacao/pedir', { email })
      setMsg(t('auth:codeSent'))
      setContador(res.data.segundosReenvio || 60)
    } catch (err) {
      if (err.response?.status === 429 && err.response?.data?.segundosRestantes)
        setContador(err.response.data.segundosRestantes)
      setErro(traduzirErro(err))
    } finally {
      setLoadingPedir(false)
    }
  }
  const alterarEmail = () => {
    setPasso(1)
    setCodigo('')
    setErro('')
    setMsg('')
  }
  const validar = async (e) => {
    e.preventDefault()
    if (loadingValidar) return
    setErro('')
    setMsg('')
    setLoadingValidar(true)
    try {
      const res = await api.post('/auth/recuperacao/validar-codigo', {
        email,
        codigo: codigo.replace(/\s/g, ''),
      })
      setResetToken(res.data.resetToken)
      setMsg(t('auth:codeVerified'))
      setPasso(3)
    } catch (err) {
      setErro(traduzirErro(err))
    } finally {
      setLoadingValidar(false)
    }
  }
  const redefinir = async (e) => {
    e.preventDefault()
    if (loadingRedefinir) return
    setErro('')
    setMsg('')
    if (novaSenha.length < 6) {
      setErro(t('auth:passwordMin'))
      return
    }
    if (novaSenha !== confirmar) {
      setErro(t('auth:passwordMismatch'))
      return
    }
    setLoadingRedefinir(true)
    try {
      await api.post('/auth/recuperacao/redefinir', { email, resetToken, novaSenha })
      setMsg(t('auth:passwordUpdated'))
      setPasso(4)
    } catch (err) {
      if (err.response?.status === 400) {
        setErro(traduzirErro(err, t('auth:invalidReset')))
        setPasso(1)
      } else setErro(traduzirErro(err))
    } finally {
      setLoadingRedefinir(false)
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-bg px-4 py-20">
      <AuthControls />
      <div className="pointer-events-none absolute -left-24 top-20 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      <div className="animate-fade-in relative w-full max-w-md">
        <div className="mb-6 text-center">
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
          <h1 className="text-3xl font-semibold text-text">{t('auth:recoveryTitle')}</h1>
        </div>
        {passo <= 3 && (
          <div className="mb-4 text-center text-sm text-muted">
            {t('auth:step', { step: passo })}
          </div>
        )}
        {msg && passo !== 4 && (
          <div className="mb-4 rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm text-text">
            {msg}
          </div>
        )}
        {erro && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
          >
            {erro}
          </div>
        )}
        {passo === 1 && (
          <form
            onSubmit={pedir}
            className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-brand/5"
          >
            <Input
              type="email"
              label={t('common:email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button loading={loadingPedir} className="w-full">
              {loadingPedir ? t('auth:sending') : t('auth:sendCode')}
            </Button>
          </form>
        )}
        {passo === 2 && (
          <form
            onSubmit={validar}
            className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-brand/5"
          >
            <p className="text-sm text-muted">{t('auth:sentTo', { email })}</p>
            <div className="rounded-xl bg-accent/10 p-2 text-xs text-accent">
              {t('auth:latestCode')}
            </div>
            <Input
              label={t('auth:codeLabel')}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              maxLength={6}
              required
            />
            <Button loading={loadingValidar} disabled={codigo.length !== 6} className="w-full">
              {loadingValidar ? t('auth:validating') : t('auth:validateCode')}
            </Button>
            <button
              type="button"
              onClick={reenviar}
              disabled={contador > 0 || loadingPedir}
              className="w-full rounded-xl border border-border py-2.5 text-sm text-text disabled:opacity-50"
            >
              {contador > 0
                ? `${t('auth:resendCode')} (${contador}s)`
                : loadingPedir
                  ? t('auth:sending')
                  : t('auth:resendCode')}
            </button>
            <button type="button" onClick={alterarEmail} className="w-full text-sm text-brand">
              {t('auth:changeEmail')}
            </button>
          </form>
        )}
        {passo === 3 && (
          <form
            onSubmit={redefinir}
            className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-brand/5"
          >
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label={t('auth:newPassword')}
                  type={mostrar ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setMostrar((v) => !v)}
                className="rounded-xl border border-border px-3 py-2.5 text-sm"
              >
                {mostrar ? t('auth:hide') : t('auth:show')}
              </button>
            </div>
            <Input
              label={t('auth:confirmPassword')}
              type={mostrar ? 'text' : 'password'}
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
            />
            <Button loading={loadingRedefinir} className="w-full">
              {loadingRedefinir ? t('auth:settingPassword') : t('auth:setPassword')}
            </Button>
          </form>
        )}
        {passo === 4 && (
          <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-xl shadow-brand/5">
            <p className="mb-4">{t('auth:passwordUpdated')}</p>
            <button
              onClick={() => navigate('/login')}
              className="rounded-xl bg-brand px-4 py-2.5 font-medium text-bg"
            >
              {t('auth:goToLogin')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
