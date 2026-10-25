import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useTranslation } from 'react-i18next'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { UserRound, ArrowUpRight } from 'lucide-react'

export default function Mentores() {
  const { t } = useTranslation(['mentoring', 'common'])
  const [mentores, setMentores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await api.get('/mentorias/mentores')
        setMentores(res.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  return (
    <div className="max-w-content mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('mentoring:mentors')}</h1>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-48" />
          ))}
        </div>
      ) : mentores.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {mentores.map((m) => (
            <Link
              key={m.id}
              to={`/mentores/${m.id}`}
              className="group rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand dark:text-accent">
                  <UserRound size={22} />
                </span>
                <div>
                  <h2 className="text-lg font-bold group-hover:text-brand dark:group-hover:text-accent">
                    {m.nome}
                  </h2>
                  {m.area && <p className="text-sm text-muted">{m.area}</p>}
                </div>
                <ArrowUpRight className="ml-auto text-muted" size={18} />
              </div>
              {m.biografia && <p className="text-sm mt-2 line-clamp-2">{m.biografia}</p>}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title={t('mentoring:noneMentors')} />
      )}
    </div>
  )
}
