import { useTranslation } from 'react-i18next'

export default function LangSwitch() {
  const { i18n, t } = useTranslation('common')
  const lang = i18n.language?.startsWith('en') ? 'en' : 'pt'
  return (
    <div
      className="inline-flex items-center rounded-xl border border-border p-1"
      aria-label={t('language')}
    >
      {['pt', 'en'].map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => i18n.changeLanguage(code)}
          aria-pressed={lang === code}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${lang === code ? 'bg-brand text-bg' : 'text-muted hover:text-text'}`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
