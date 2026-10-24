import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [aberto, setAberto] = useState(false)
  const navigate = useNavigate()

  const sair = async () => {
    await logout()
    navigate('/')
    setAberto(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-bold text-lg text-blue-700">Gestão de Bolsas e Mentorias</Link>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/" className="hover:text-blue-600">Início</Link>
              <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link>
              <Link to="/bolsas" className="hover:text-blue-600">Bolsas</Link>
              <Link to="/mentores" className="hover:text-blue-600">Mentores</Link>
              {user && user.role !== 'ADMIN' && <Link to="/mentorias" className="hover:text-blue-600">Mentorias</Link>}
              {user && user.role === 'ESTUDANTE' && <Link to="/candidaturas" className="hover:text-blue-600">Candidaturas</Link>}
              {user && <Link to="/minha-conta" className="hover:text-blue-600">Minha Conta</Link>}
              {user?.role === 'ADMIN' && <Link to="/admin" className="hover:text-blue-600">Admin</Link>}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login" className="px-4 py-2 rounded hover:bg-gray-100">Entrar</Link>
                <Link to="/registo" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Registar</Link>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-700">{user.nome}</span>
                <button onClick={sair} className="px-4 py-2 rounded hover:bg-gray-100">Sair</button>
              </>
            )}
          </div>
          <button className="md:hidden" onClick={() => setAberto(!aberto)}>☰</button>
        </div>
      </div>
      {aberto && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-2 flex flex-col gap-2">
            <Link to="/" onClick={() => setAberto(false)}>Início</Link>
            <Link to="/dashboard" onClick={() => setAberto(false)}>Dashboard</Link>
            <Link to="/bolsas" onClick={() => setAberto(false)}>Bolsas</Link>
            <Link to="/mentores" onClick={() => setAberto(false)}>Mentores</Link>
            {user && user.role !== 'ADMIN' && <Link to="/mentorias" onClick={() => setAberto(false)}>Mentorias</Link>}
            {user && user.role === 'ESTUDANTE' && <Link to="/candidaturas" onClick={() => setAberto(false)}>Candidaturas</Link>}
            {user && <Link to="/minha-conta" onClick={() => setAberto(false)}>Minha Conta</Link>}
            {user?.role === 'ADMIN' && <Link to="/admin" onClick={() => setAberto(false)}>Admin</Link>}
            {!user ? (
              <>
                <Link to="/login" onClick={() => setAberto(false)}>Entrar</Link>
                <Link to="/registo" onClick={() => setAberto(false)}>Registar</Link>
              </>
            ) : (
              <button onClick={sair} className="text-left">Sair ({user.nome})</button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
