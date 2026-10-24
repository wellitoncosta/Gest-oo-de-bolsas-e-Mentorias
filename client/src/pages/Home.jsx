import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Plataforma de Gestão de Bolsas e Agendamento de Mentorias</h1>
        <p className="text-lg text-gray-600 mb-6">Conectamos estudantes, mentores e oportunidades</p>
        <div className="flex gap-4 justify-center">
          <Link to="/bolsas" className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">Ver Bolsas</Link>
          <Link to="/mentores" className="px-6 py-3 bg-gray-200 rounded hover:bg-gray-300">Ver Mentores</Link>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-bold text-xl mb-2">Bolsas</h2>
          <p className="text-gray-600">Descubra e candidate-se a bolsas de estudo e investigação.</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-bold text-xl mb-2">Mentorias</h2>
          <p className="text-gray-600">Agende sessões com mentores experientes para orientação.</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-bold text-xl mb-2">Acompanhamento</h2>
          <p className="text-gray-600">Gira candidaturas e mentorias num só local.</p>
        </div>
      </div>
    </div>
  )
}
