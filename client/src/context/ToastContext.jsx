import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import Toast from '../components/ui/Toast'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const dismiss = useCallback(
    (id) => setItems((current) => current.filter((item) => item.id !== id)),
    [],
  )
  const show = useCallback(
    (message, type) => {
      const id = `${Date.now()}-${Math.random()}`
      setItems((current) => [...current, { id, message, type }])
      window.setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )
  const value = useMemo(
    () => ({
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
    }),
    [show],
  )
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-4 top-20 z-[90] grid w-[min(24rem,calc(100vw-2rem))] gap-2"
        aria-live="polite"
      >
        {items.map((item) => (
          <Toast key={item.id} type={item.type}>
            {item.message}
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast deve ser utilizado dentro de ToastProvider')
  return context
}
