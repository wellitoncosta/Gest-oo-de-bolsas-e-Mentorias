import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useTranslation } from 'react-i18next'

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

  if (loading) return <div className="p-8 text-center">{t('common:loading')}</div>

  return (
    <div className="max-w-content mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('mentoring:mentors')}</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {mentores.map(m => (
          <Link key={m.id} to={`/mentores/${m.id}`} className="bg-surface p-4 rounded shadow hover:shadow-md">
            <h2 className="font-bold text-lg">{m.nome}</h2>
            {m.area && <p className="text-sm text-muted">{m.area}</p>}
            {m.biografia && <p className="text-sm mt-2 line-clamp-2">{m.biografia}</p>}
          </Link>
        ))}
      </div>
      {mentores.length === 0 && <p className="text-muted">{t('mentoring:noneMentors')}</p>}
    </div>
  )
}
