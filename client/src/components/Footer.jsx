import { Link } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

function SocialIcon({ network }) {
  return network === 'instagram' ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[17px] w-[17px]" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[17px] w-[17px]" aria-hidden="true">
      <path d="M5.2 3.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.4 9.5H7v11H3.4v-11Zm5.8 0h3.5V11h.1a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5v5.9h-3.7v-5.2c0-1.2 0-2.8-1.8-2.8s-2.1 1.3-2.1 2.7v5.3H9.2v-11Z" />
    </svg>
  )
}

export default function Footer() {
  const { t, i18n } = useTranslation(['footer', 'nav'])
  const { user } = useAuth()
  const language = i18n.language?.startsWith('en') ? 'en' : 'pt'
  const email = import.meta.env.VITE_CONTACT_EMAIL || ''
  const instagram = import.meta.env.VITE_INSTAGRAM_URL || ''
  const linkedin = import.meta.env.VITE_LINKEDIN_URL || ''
  const sections = [
    { title: t('browseTitle'), links: [...(!user ? [{ to: '/', label: t('home') }] : []), { to: '/dashboard', label: t('dashboard') }, { to: '/bolsas', label: t('scholarships') }, { to: '/mentores', label: t('mentors') }] },
    { title: t('platformTitle'), links: [{ to: '/candidaturas', label: t('applications') }, { to: '/mentorias', label: t('mentoring') }, { to: '/minha-conta', label: t('account'), show: Boolean(user) }, { to: '/registo', label: t('register'), show: !user }] },
    { title: t('usefulTitle'), links: [{ to: '/termos', label: t('terms') }, { to: '/privacidade', label: t('privacy') }, { to: '/#faq', label: t('faq') }, ...(email ? [{ to: `mailto:${email}`, label: t('contact') }] : [])] },
  ]
  const changeLanguage = (code) => {
    void i18n.changeLanguage(code)
  }
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer className="mx-4 mb-4 mt-10 rounded-[28px] bg-footer-bg text-footer-text sm:mx-5 sm:mb-5">
      <div className="mx-auto max-w-[1280px] px-6 py-10 sm:px-10 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          <div>
            <Link to={user ? '/dashboard' : '/'} aria-label="B&M – Bolsas e Mentoria" className="inline-flex">
              <img src="/logos/logo-dark.png" alt="B&M – Bolsas e Mentoria" className="h-10 w-auto" />
            </Link>
            {email && <a href={`mailto:${email}`} className="footer-link mt-5 block break-all text-sm text-footer-muted">{email}</a>}
            <p className="mt-2 text-sm text-footer-muted">{t('location')}</p>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-footer-muted">{t('availableIn')}</p>
            <div className="mt-2 inline-flex rounded-full bg-white/10 p-1" aria-label={t('language')}>
              {['pt', 'en'].map((code) => <button key={code} type="button" onClick={() => changeLanguage(code)} aria-pressed={language === code} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${language === code ? 'bg-white text-slate-950' : 'text-white/70 hover:text-white'}`}>{code.toUpperCase()}</button>)}
            </div>
          </div>
          {sections.map((section) => <div key={section.title}>
            <h2 className="text-sm font-semibold text-white">{section.title}</h2>
            <nav className="mt-4 flex flex-col items-start gap-3 text-sm text-footer-muted">
              {section.links.filter((link) => link.show !== false).map((link) => <Link key={link.to} to={link.to} className="footer-link">{link.label}</Link>)}
            </nav>
          </div>)}
          <div className="rounded-3xl bg-white/[0.06] p-5 sm:col-span-2 lg:col-span-1">
            <h2 className="font-display text-xl font-semibold leading-snug text-white">{t('callTitle')}</h2>
            <a href={email ? `mailto:${email}` : '/#faq'} className="mt-5 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-bg transition hover:brightness-95">{t('contactCta')}</a>
            <p className="mt-3 text-xs leading-5 text-footer-muted">{t('callText')}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-5 text-xs text-footer-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={scrollTop} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-footer-text hover:bg-white/10"><ArrowUp size={14} />{t('backToTop')}</button>
            {instagram ? <a href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full p-2 text-footer-text hover:bg-white/10"><SocialIcon network="instagram" /></a> : <span aria-hidden="true" className="rounded-full p-2 text-footer-muted"><SocialIcon network="instagram" /></span>}
            {linkedin ? <a href={linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="rounded-full p-2 text-footer-text hover:bg-white/10"><SocialIcon network="linkedin" /></a> : <span aria-hidden="true" className="rounded-full p-2 text-footer-muted"><SocialIcon network="linkedin" /></span>}
          </div>
        </div>
      </div>
    </footer>
  )
}
