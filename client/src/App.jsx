import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ConfirmProvider } from './context/ConfirmContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Skeleton from './components/ui/Skeleton'

const Home = lazy(() => import('./pages/Home'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Bolsas = lazy(() => import('./pages/Bolsas'))
const BolsaDetalhe = lazy(() => import('./pages/BolsaDetalhe'))
const Mentores = lazy(() => import('./pages/Mentores'))
const MentorDetalhe = lazy(() => import('./pages/MentorDetalhe'))
const Mentorias = lazy(() => import('./pages/Mentorias'))
const MinhaConta = lazy(() => import('./pages/MinhaConta'))
const MinhasCandidaturas = lazy(() => import('./pages/MinhasCandidaturas'))
const Login = lazy(() => import('./pages/Login'))
const Registo = lazy(() => import('./pages/Registo'))
const Recuperacao = lazy(() => import('./pages/Recuperacao'))
const Admin = lazy(() => import('./pages/Admin'))
const NaoAutorizado = lazy(() => import('./pages/NaoAutorizado'))

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

function AppContent() {
  const location = useLocation()
  const isAuth = ['/login', '/registo', '/recuperacao'].includes(location.pathname)
  return (
    <>
      {!isAuth && <Navbar />}
      <main className={`${isAuth ? '' : 'pt-[72px]'} min-h-screen bg-bg text-text`}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bolsas" element={<Bolsas />} />
            <Route path="/bolsas/:id" element={<BolsaDetalhe />} />
            <Route path="/mentores" element={<Mentores />} />
            <Route path="/mentores/:id" element={<MentorDetalhe />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registo" element={<Registo />} />
            <Route path="/recuperacao" element={<Recuperacao />} />
            <Route path="/nao-autorizado" element={<NaoAutorizado />} />
            <Route
              path="/mentorias"
              element={
                <ProtectedRoute>
                  <Mentorias />
                </ProtectedRoute>
              }
            />
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
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
