import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function KpiCard({ label, value = 0, change, icon: Icon, sparkline = [], suffix = '', decimals = 0 }) {
  const { i18n } = useTranslation()
  const [shown, setShown] = useState(0)
  const [entered, setEntered] = useState(false)
  const ref = useRef(null)
  const pontos = sparkline
  const maximo = Math.max(...pontos, 1)
  const minimo = Math.min(...pontos, 0)
  const polilinha = pontos.map((ponto, indice) => {
    const x = pontos.length > 1 ? (indice / (pontos.length - 1)) * 72 : 36
    const y = 23 - ((ponto - minimo) / Math.max(maximo - minimo, 1)) * 20
    return `${x},${y}`
  }).join(' ')
  const variacao = typeof change === 'object' && change !== null ? change : null

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setEntered(true)
      return undefined
    }
    if (!ref.current || !('IntersectionObserver' in window)) {
      setEntered(true)
      return undefined
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const end = Number(value) || 0
    if (!entered) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(end)
      return undefined
    }
    let frame
    const start = performance.now()
    const animate = (now) => {
      const ratio = Math.min((now - start) / 850, 1)
      const factor = 10 ** decimals
      setShown(Math.round(end * ratio * factor) / factor)
      if (ratio < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [decimals, entered, value])

  return (
    <div ref={ref} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between text-sm text-muted">
        {label}
        {Icon && <Icon size={18} className="text-brand" />}
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums text-text">
        {new Intl.NumberFormat(i18n.language?.startsWith('en') ? 'en-GB' : 'pt-PT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(shown)}{suffix}
      </div>
      {(variacao || typeof change === 'string' || pontos.length > 1) && <div className="mt-3 flex items-end justify-between gap-3">
        <div className={`text-xs font-medium ${variacao?.diferenca > 0 ? 'text-accent' : variacao?.diferenca < 0 ? 'text-danger' : 'text-muted'}`}>
          {variacao && <span aria-hidden="true">{variacao.diferenca > 0 ? '▲ ' : variacao.diferenca < 0 ? '▼ ' : '• '}</span>}
          {variacao?.texto || (typeof change === 'string' ? change : '')}
        </div>
        {pontos.length > 1 && <svg viewBox="0 0 72 26" className="h-7 w-[76px] overflow-visible text-brand dark:text-accent" role="img" aria-label={label}>
          <polyline points={polilinha} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>}
      </div>}
    </div>
  )
}
