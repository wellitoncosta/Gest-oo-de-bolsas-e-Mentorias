import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function MentorDetalhe() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mentor, setMentor] = useState(null)
  const [disps, setDisps] = useState([])
  const [tema, setTema] = useState('')
  const [sel, setSel] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      try {
        const [m, d] = await Promise.all([
          api.get(`/mentorias/mentores/${id}`),
          api.get(`/mentorias/disponibilidades?mentorId=${id}`)
        ])
        setMentor(m.data)
        setDisps(d.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [id])

  const agendar = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/mentores/${id}` }, mensagem: 'Precisa de iniciar sessão para agendar mentoria.' } })
      return
    }
    if (!sel || !tema) { setErro('Selecione um horário e indique o tema'); return }
    setErro(''); setSucesso('')
    try {
      await api.post('/mentorias/agendar', { disponibilidadeId: sel, tema })
      setSucesso('Pedido de mentoria enviado!')
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro ao agendar')
    }
  }

  if (loading) return <div className="p-8 text-center">A carregar...</div>
  if (!mentor) return <div className="p-8 text-center">Mentor não encontrado</div>

  const livres = disps.filter(d => !d.mentorias?.some(m => m.status === 'PENDENTE' || m.status === 'CONFIRMADA'))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded shadow mb-6">
        <h1 className="text-2xl font-bold mb-2">{mentor.nome}</h1>
        {mentor.area && <p className="text-gray-600 mb-2">{mentor.area}</p>}
        {mentor.biografia && <p className="text-gray-700">{mentor.biografia}</p>}
      </div>
      <div className="bg-white p-6 rounded shadow">
        <h2 className="font-bold text-lg mb-4">Disponibilidades</h2>
        {erro && <div className="mb-3 p-3 bg-red-100 text-red-700 rounded">{erro}</div>}
        {sucesso && <div className="mb-3 p-3 bg-green-100 text-green-700 rounded">{sucesso}</div>}
        {livres.length === 0 ? <p className="text-gray-500">Sem horários disponíveis</p> : (
          <div className="space-y-3">
            {livres.map(d => (
              <label key={d.id} className="flex items-center gap-3 border p-3 rounded cursor-pointer">
                <input type="radio" name="disp" value={d.id} onChange={(e) => setSel(e.target.value)} />
                <div><div className="font-medium">{new Date(d.data).toLocaleDateString('pt-PT')} • {d.horaInicio} - {d.horaFim}</div></div>
              </label>
            ))}
          </div>
        )}
        {user?.role === 'ESTUDANTE' && livres.length > 0 && (
          <div className="mt-4 space-y-3">
            <input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Tema da mentoria" className="w-full border rounded px-3 py-2" />
            <button onClick={agendar} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Pedir agendamento</button>
          </div>
        )}
        {!user && livres.length > 0 && <p className="text-gray-500 mt-3">Inicie sessão como estudante para agendar.</p>}
      </div>
    </div>
  )
}
