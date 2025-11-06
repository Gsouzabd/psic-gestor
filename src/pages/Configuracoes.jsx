import { useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

export default function Configuracoes() {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const [formData, setFormData] = useState({
    senhaAtual: '',
    senhaNova: '',
    senhaNovaConfirmacao: ''
  })
  
  const [showPasswords, setShowPasswords] = useState({
    senhaAtual: false,
    senhaNova: false,
    senhaNovaConfirmacao: false
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccessMessage('')
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const validateForm = () => {
    if (!formData.senhaAtual) {
      setError('Por favor, informe sua senha atual')
      return false
    }

    if (!formData.senhaNova) {
      setError('Por favor, informe a nova senha')
      return false
    }

    if (formData.senhaNova.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres')
      return false
    }

    if (formData.senhaNova !== formData.senhaNovaConfirmacao) {
      setError('As senhas não coincidem')
      return false
    }

    if (formData.senhaAtual === formData.senhaNova) {
      setError('A nova senha deve ser diferente da senha atual')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      // Verificar senha atual fazendo login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.senhaAtual
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Senha atual incorreta')
        } else {
          setError('Erro ao verificar senha atual: ' + authError.message)
        }
        setLoading(false)
        return
      }

      // Se chegou aqui, a senha atual está correta
      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.senhaNova
      })

      if (updateError) {
        setError('Erro ao alterar senha: ' + updateError.message)
        setLoading(false)
        return
      }

      // Sucesso!
      setSuccessMessage('Senha alterada com sucesso!')
      success('Senha alterada com sucesso!')
      
      // Limpar formulário
      setFormData({
        senhaAtual: '',
        senhaNova: '',
        senhaNovaConfirmacao: ''
      })

      // Fazer logout e login novamente para aplicar a nova senha
      setTimeout(async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
      }, 2000)

    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      setError('Erro inesperado ao alterar senha. Tente novamente.')
      showError('Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Alterar Senha
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Altere sua senha de acesso ao sistema
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm text-green-800 font-medium">{successMessage}</span>
                  <p className="text-xs text-green-700 mt-1">Você será redirecionado para o login em instantes...</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="senhaAtual" className="block text-sm font-medium text-gray-700 mb-2">
                Senha Atual *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.senhaAtual ? "text" : "password"}
                  id="senhaAtual"
                  name="senhaAtual"
                  value={formData.senhaAtual}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Digite sua senha atual"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('senhaAtual')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  disabled={loading}
                >
                  {showPasswords.senhaAtual ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="senhaNova" className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.senhaNova ? "text" : "password"}
                  id="senhaNova"
                  name="senhaNova"
                  value={formData.senhaNova}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                  required
                  minLength={6}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('senhaNova')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  disabled={loading}
                >
                  {showPasswords.senhaNova ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                A senha deve ter pelo menos 6 caracteres
              </p>
            </div>

            <div>
              <label htmlFor="senhaNovaConfirmacao" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nova Senha *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.senhaNovaConfirmacao ? "text" : "password"}
                  id="senhaNovaConfirmacao"
                  name="senhaNovaConfirmacao"
                  value={formData.senhaNovaConfirmacao}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Digite a nova senha novamente"
                  required
                  minLength={6}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('senhaNovaConfirmacao')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  disabled={loading}
                >
                  {showPasswords.senhaNovaConfirmacao ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    senhaAtual: '',
                    senhaNova: '',
                    senhaNovaConfirmacao: ''
                  })
                  setError('')
                  setSuccessMessage('')
                }}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                disabled={loading}
              >
                Limpar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Alterando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Alterar Senha
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Dicas de Segurança</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Use uma senha forte com pelo menos 8 caracteres</li>
            <li>• Combine letras maiúsculas, minúsculas, números e símbolos</li>
            <li>• Não compartilhe sua senha com ninguém</li>
            <li>• Altere sua senha periodicamente</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}

