import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Bolsas from './pages/Bolsas'
import BolsaDetalhe from './pages/BolsaDetalhe'
import Mentores from './pages/Mentores'
import MentorDetalhe from './pages/MentorDetalhe'
import Mentorias from './pages/Mentorias'
import MinhaConta from './pages/MinhaConta'
import MinhasCandidaturas from './pages/MinhasCandidaturas'
import Login from './pages/Login'
import Registo from './pages/Registo'
import Recuperacao from './pages/Recuperacao'
import Admin from './pages/Admin'
import NaoAutorizado from './pages/NaoAutorizado'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="pt-16 min-h-screen bg-gray-50">
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
            <Route path="/mentorias" element={<ProtectedRoute><Mentorias /></ProtectedRoute>} />
            <Route path="/candidaturas" element={<ProtectedRoute roles={['ESTUDANTE']}><MinhasCandidaturas /></ProtectedRoute>} />
            <Route path="/minha-conta" element={<ProtectedRoute><MinhaConta /></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute roles={['ADMIN']}><Admin /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
