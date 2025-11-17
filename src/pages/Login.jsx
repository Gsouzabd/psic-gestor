import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, AlertCircle, User, Scissors } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [systemType, setSystemType] = useState('psicgestor')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError('Email ou senha inválidos')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              {systemType === 'psicgestor' ? 'Psic Gestor' : 'Estetic Gestor'}
            </h1>
            <p className="text-gray-600">Entre na sua conta</p>
          </div>

          {/* Tabs de seleção do sistema */}
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setSystemType('psicgestor')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition ${
                  systemType === 'psicgestor'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Psic Gestor</span>
              </button>
              <button
                type="button"
                onClick={() => setSystemType('esteticgestor')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition ${
                  systemType === 'esteticgestor'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span>Estetic Gestor</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

