import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="p-8 text-center">A carregar...</div>
  if (!user) return <Navigate to="/login" state={{ from: location, mensagem: 'Precisa de iniciar sessão para aceder a esta página.' }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/nao-autorizado" replace />
  return children
}
