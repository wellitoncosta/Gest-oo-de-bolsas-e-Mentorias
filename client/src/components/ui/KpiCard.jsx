import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
export default function KpiCard({ label, value = 0, change, icon: Icon }) {
  const { i18n } = useTranslation()
  const [shown, setShown] = useState(0)
  useEffect(() => { const end = Number(value) || 0; if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setShown(end); return undefined }; let frame; const start = performance.now(); const animate = now => { const ratio = Math.min((now - start) / 450, 1); setShown(Math.round(end * ratio)); if (ratio < 1) frame = requestAnimationFrame(animate) }; frame = requestAnimationFrame(animate); return () => cancelAnimationFrame(frame) }, [value])
  return <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm"><div className="flex items-center justify-between text-sm text-muted">{label}{Icon && <Icon size={18} className="text-brand" />}</div><div className="mt-3 text-3xl font-semibold tabular-nums text-text">{new Intl.NumberFormat(i18n.language?.startsWith('en') ? 'en-GB' : 'pt-PT').format(shown)}</div>{change && <div className="mt-1 text-xs text-accent">{change}</div>}</div>
}
