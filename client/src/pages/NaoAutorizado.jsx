import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function NaoAutorizado() {
  const { t } = useTranslation('common')
  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <h1 className="text-2xl font-bold mb-4">{t('forbiddenTitle')}</h1>
      <p className="text-muted mb-6">{t('forbiddenMessage')}</p>
      <Link to="/" className="rounded-xl bg-brand px-4 py-2 text-bg">
        {t('backHome')}
      </Link>
    </div>
  )
}
