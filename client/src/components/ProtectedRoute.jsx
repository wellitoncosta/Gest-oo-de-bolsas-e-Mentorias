import { Navigate, useLocation } from 'react-router-dom'
import Skeleton from './ui/Skeleton'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading)
    return (
      <div className="mx-auto grid max-w-content gap-4 px-5 py-12">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-48" />
      </div>
    )
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: location, mensagem: 'Precisa de iniciar sessão para aceder a esta página.' }}
        replace
      />
    )
  if (roles && !roles.includes(user.role)) return <Navigate to="/nao-autorizado" replace />
  return children
}
