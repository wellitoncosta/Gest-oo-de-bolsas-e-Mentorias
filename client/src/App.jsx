import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ConfirmProvider } from './context/ConfirmContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Skeleton from './components/ui/Skeleton'
import { useAuth } from './context/AuthContext'
import { RealtimeProvider } from './context/RealtimeContext'

const Home = lazy(() => import('./pages/Home'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Bolsas = lazy(() => import('./pages/Bolsas'))
const BolsaDetalhe = lazy(() => import('./pages/BolsaDetalhe'))
const Mentoria = lazy(() => import('./pages/Mentoria'))
const MentorDetalhe = lazy(() => import('./pages/MentorDetalhe'))
const MinhaConta = lazy(() => import('./pages/MinhaConta'))
const MinhasCandidaturas = lazy(() => import('./pages/MinhasCandidaturas'))
const Login = lazy(() => import('./pages/Login'))
const Registo = lazy(() => import('./pages/Registo'))
const Recuperacao = lazy(() => import('./pages/Recuperacao'))
const Admin = lazy(() => import('./pages/Admin'))
const NaoAutorizado = lazy(() => import('./pages/NaoAutorizado'))
const LegalPages = lazy(() => import('./pages/LegalPages'))

function RouteFallback() {
  return (
    <div className="mx-auto grid max-w-content gap-4 px-5 py-12" aria-label="A carregar">
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-5 w-1/2" />
      <div className="grid gap-4 pt-8 sm:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <RouteFallback />
  return user ? <Navigate to="/dashboard" replace /> : children
}

function AppContent() {
  const location = useLocation()
  const isAuth = ['/login', '/registo', '/recuperacao', '/recuperar'].includes(location.pathname)
  return (
    <>
      {!isAuth && <Navbar />}
      <main className="min-h-screen bg-bg text-text">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bolsas" element={<Bolsas />} />
            <Route path="/bolsas/:id" element={<BolsaDetalhe />} />
            <Route path="/mentoria" element={<Mentoria />} />
            <Route path="/mentores" element={<Navigate to="/mentoria" replace />} />
            <Route path="/mentores/:id" element={<MentorDetalhe />} />
            <Route path="/termos" element={<LegalPages type="terms" />} />
            <Route path="/privacidade" element={<LegalPages type="privacy" />} />
            <Route
              path="/login"
              element={
                <GuestOnly>
                  <Login />
                </GuestOnly>
              }
            />
            <Route
              path="/registo"
              element={
                <GuestOnly>
                  <Registo />
                </GuestOnly>
              }
            />
            <Route
              path="/recuperacao"
              element={
                <GuestOnly>
                  <Recuperacao />
                </GuestOnly>
              }
            />
            <Route
              path="/recuperar"
              element={
                <GuestOnly>
                  <Recuperacao />
                </GuestOnly>
              }
            />
            <Route path="/nao-autorizado" element={<NaoAutorizado />} />
            <Route path="/mentorias" element={<Navigate to="/mentoria?tab=sessoes" replace />} />
            <Route
              path="/candidaturas"
              element={
                <ProtectedRoute roles={['ESTUDANTE']}>
                  <MinhasCandidaturas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/minha-conta"
              element={
                <ProtectedRoute>
                  <MinhaConta />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </main>
      {!isAuth && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <RealtimeProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </RealtimeProvider>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
