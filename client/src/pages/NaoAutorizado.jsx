import { Link } from 'react-router-dom'

export default function NaoAutorizado() {
  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <h1 className="text-2xl font-bold mb-4">Sem permissão</h1>
      <p className="text-gray-600 mb-6">Não tem permissão para aceder a esta página.</p>
      <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded">Voltar ao início</Link>
    </div>
  )
}
