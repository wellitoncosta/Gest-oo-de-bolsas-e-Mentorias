import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../design/ThemeProvider'

export default function ThemeToggle() {
  const { dark, toggle } = useTheme()
  const { t } = useTranslation('common')
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('toggleTheme')}
      title={t('toggleTheme')}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text hover:bg-bg"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
