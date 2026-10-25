import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation('nav')
  return <footer className="border-t border-border bg-surface/70">
    <div className="mx-auto flex max-w-content flex-col gap-4 px-5 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <Link to="/" aria-label="B&M – Bolsas e Mentoria"><img src="/logos/logo-light.png" alt="B&M – Bolsas e Mentoria" className="h-7 w-auto dark:hidden" /><img src="/logos/logo-dark.png" alt="B&M – Bolsas e Mentoria" className="hidden h-7 w-auto dark:block" /></Link>
      <nav className="flex flex-wrap gap-x-5 gap-y-2"><Link to="/">{t('home')}</Link><Link to="/bolsas">{t('scholarships')}</Link><Link to="/mentores">{t('mentors')}</Link></nav>
      <span>© {new Date().getFullYear()} B&amp;M</span>
    </div>
  </footer>
}
