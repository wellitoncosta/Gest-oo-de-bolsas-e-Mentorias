import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function BackButton({ to = '/', label, onClick, className = '' }) {
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  return (
    <button
      type="button"
      onClick={onClick || (() => (window.history.length > 1 ? navigate(-1) : navigate(to)))}
      className={`inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:bg-bg hover:text-text ${className}`}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {label || t('back')}
    </button>
  )
}
