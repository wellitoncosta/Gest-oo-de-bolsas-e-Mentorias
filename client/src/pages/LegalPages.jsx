import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function LegalPages({ type }) {
  const { t } = useTranslation('legal')
  const title = t(`${type}.title`)
  const sections = t(`${type}.sections`, { returnObjects: true })
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
      <Link to="/" className="text-sm font-medium text-brand hover:underline dark:text-accent">{t('back')}</Link>
      <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-accent">B&amp;M</p>
      <h1 className="mt-2 text-4xl font-semibold">{title}</h1>
      <p className="mt-4 text-sm text-muted">{t('updated', { date: '25/10/2026' })}</p>
      <div className="mt-10 space-y-8">
        {Array.isArray(sections) && sections.map((section) => <section key={section.title}>
          <h2 className="text-xl font-semibold">{section.title}</h2>
          <p className="mt-3 leading-7 text-muted">{section.text}</p>
        </section>)}
      </div>
    </article>
  )
}
