import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await api.get('/auth/me')
        setUser(res.data.user)
      } catch (err) {
        if (err.response?.data?.codigo === 'CONTA_BLOQUEADA') {
          setUser(null)
        } else {
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  const login = async (email, senha) => {
    try {
      const res = await api.post('/auth/login', { email, senha })
      setUser(res.data.user)
      return res.data
    } catch (err) {
      if (err.response?.data?.codigo === 'CONTA_BLOQUEADA') {
        throw err
      }
      throw err
    }
  }

  const registar = async (dados) => {
    const res = await api.post('/auth/registar', dados)
    setUser(res.data.user)
    return res.data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, registar, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
