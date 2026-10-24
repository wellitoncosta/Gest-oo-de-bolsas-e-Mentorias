import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function BolsaDetalhe() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bolsa, setBolsa] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await api.get(`/bolsas/${id}`)
        setBolsa(res.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [id])

  const candidatar = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/bolsas/${id}` }, mensagem: 'Precisa de iniciar sessão para se candidatar.' } })
      return
    }
    setErro(''); setSucesso('')
    try {
      await api.post(`/candidaturas/bolsa/${id}`, { mensagem })
      setSucesso('Candidatura enviada com sucesso!')
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro ao candidatar')
    }
  }

  if (loading) return <div className="p-8 text-center">A carregar...</div>
  if (!bolsa) return <div className="p-8 text-center">Bolsa não encontrada</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded shadow">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">{bolsa.titulo}</h1>
          <span className={`text-xs px-2 py-1 rounded h-fit ${bolsa.status === 'ABERTA' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{bolsa.status}</span>
        </div>
        <p className="text-gray-600 mb-4">{bolsa.entidade} • {bolsa.area}</p>
        <div className="space-y-4 mb-6">
          <div><h2 className="font-semibold">Descrição</h2><p className="text-gray-700 whitespace-pre-wrap">{bolsa.descricao}</p></div>
          {bolsa.requisitos && <div><h2 className="font-semibold">Requisitos</h2><p className="text-gray-700 whitespace-pre-wrap">{bolsa.requisitos}</p></div>}
          {bolsa.valor && <div><h2 className="font-semibold">Valor</h2><p className="text-gray-700">{bolsa.valor}</p></div>}
          <div><h2 className="font-semibold">Data limite</h2><p className="text-gray-700">{new Date(bolsa.dataLimite).toLocaleDateString('pt-PT')}</p></div>
        </div>
        {bolsa.status === 'ABERTA' && (
          <div className="border-t pt-4">
            <h2 className="font-semibold mb-2">Candidatar-me</h2>
            {erro && <div className="mb-3 p-3 bg-red-100 text-red-700 rounded">{erro}</div>}
            {sucesso && <div className="mb-3 p-3 bg-green-100 text-green-700 rounded">{sucesso}</div>}
            {user?.role === 'ESTUDANTE' ? (
              <div className="space-y-3">
                <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Mensagem (opcional)" className="w-full border rounded px-3 py-2" rows={3}></textarea>
                <button onClick={candidatar} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Enviar candidatura</button>
              </div>
            ) : user ? (
              <p className="text-gray-500">Apenas estudantes podem candidatar-se.</p>
            ) : (
              <p className="text-gray-500">Inicie sessão como estudante para candidatar-se.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
