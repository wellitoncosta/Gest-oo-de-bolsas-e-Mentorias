import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const RealtimeContext = createContext({ online: false })
const EVENTOS = [
  'bolsa:criada',
  'bolsa:atualizada',
  'bolsa:removida',
  'candidatura:nova',
  'candidatura:estado',
  'mentoria:nova',
  'mentoria:estado',
  'disponibilidade:alterada',
  'estatisticas:alteradas',
  'conta:bloqueada',
]

function emitirAtualizacao(evento = 'refresh', dados = {}) {
  window.dispatchEvent(new CustomEvent('realtime:event', { detail: { evento, dados } }))
}

function urlEventos() {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const base = apiBase.replace(/\/$/, '')
  const raw = `${base}/eventos`
  return new URL(raw, window.location.origin).toString()
}

export function RealtimeProvider({ children }) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const { t } = useTranslation(['common', 'errors'])
  const [online, setOnline] = useState(false)
  const onlineRef = useRef(online)
  onlineRef.current = online
  const userId = user?.id

  useEffect(() => {
    let active = true
    let source
    let retryTimer
    let pollTimer
    let attempts = 0

    const connect = () => {
      if (!active) return
      setOnline(false)
      source = new EventSource(urlEventos(), { withCredentials: true })
      source.onopen = () => {
        if (!active) return
        attempts = 0
        setOnline(true)
        emitirAtualizacao()
      }
      source.onerror = () => {
        if (!active) return
        setOnline(false)
        source.close()
        const delay = Math.min(30_000, 1_000 * 2 ** Math.min(attempts, 5))
        attempts += 1
        retryTimer = window.setTimeout(connect, delay)
      }
      for (const evento of EVENTOS) {
        source.addEventListener(evento, (message) => {
          let dados = {}
          try {
            dados = JSON.parse(message.data || '{}')
          } catch {
            /* Ignora eventos inválidos. */
          }
          emitirAtualizacao(evento, dados)
          if (evento === 'conta:bloqueada' && (!dados.userId || dados.userId === userId)) {
            toast.error(t('errors:CONTA_BLOQUEADA'))
            void logout()
          }
        })
      }
    }

    connect()
    pollTimer = window.setInterval(() => {
      if (!onlineRef.current) emitirAtualizacao()
    }, 30_000)
    const aoVisibilizar = () => {
      if (document.visibilityState === 'visible') emitirAtualizacao()
    }
    document.addEventListener('visibilitychange', aoVisibilizar)
    return () => {
      active = false
      source?.close()
      window.clearTimeout(retryTimer)
      window.clearInterval(pollTimer)
      document.removeEventListener('visibilitychange', aoVisibilizar)
    }
  }, [userId, logout, toast, t])

  const value = useMemo(() => ({ online }), [online])
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRealtime(eventos, handler) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  const chave = [...new Set(eventos)].sort().join('|')
  const receber = useCallback(
    (event) => {
      if (event.detail.evento === 'refresh' || chave.split('|').includes(event.detail.evento)) {
        Promise.resolve(handlerRef.current?.(event.detail)).catch((error) => console.error(error))
      }
    },
    [chave],
  )

  useEffect(() => {
    window.addEventListener('realtime:event', receber)
    return () => window.removeEventListener('realtime:event', receber)
  }, [receber, chave])
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRealtimeStatus() {
  return useContext(RealtimeContext)
}
