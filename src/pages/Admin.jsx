import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Users, Plus, Edit, Trash2, Search, AlertCircle, Shield, Eye, EyeOff, RefreshCw } from 'lucide-react'

export default function Admin() {
  const { user, isAdmin } = useAuth()
  const { success, error: showError } = useToast()
  const [psicologos, setPsicologos] = useState([])
  const [filteredPsicologos, setFilteredPsicologos] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [editingPsicologo, setEditingPsicologo] = useState(null)
  const [resettingPasswordFor, setResettingPasswordFor] = useState(null)
  const [saving, setSaving] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [error, setError] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({})

  // Formulário
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: ''
  })

  useEffect(() => {
    if (user && isAdmin) {
      fetchPsicologos()
    }
  }, [user, isAdmin])

  useEffect(() => {
    if (searchTerm) {
      const filtered = psicologos.filter(p =>
        p.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPsicologos(filtered)
    } else {
      setFilteredPsicologos(psicologos)
    }
  }, [searchTerm, psicologos])

  const fetchPsicologos = async () => {
    try {
      // Buscar psicólogos via Edge Function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('list-psychologists')

      if (functionError) throw functionError

      if (functionData?.error) {
        throw new Error(functionData.error)
      }

      const psicologosList = functionData?.data || []
      setPsicologos(psicologosList)
      setFilteredPsicologos(psicologosList)
    } catch (error) {
      console.error('Erro ao buscar psicólogos:', error)
      showError('Erro ao carregar lista de psicólogos')
    } finally {
      setLoading(false)
    }
  }

  // Função para gerar senha aleatória
  const generatePassword = () => {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const senha = generatePassword()

      // Criar usuário via Edge Function ou API Admin
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-psychologist', {
        body: {
          nome_completo: formData.nome_completo,
          email: formData.email,
          senha: senha
        }
      })

      if (functionError) throw functionError

      if (functionData?.error) {
        throw new Error(functionData.error)
      }

      success(`Psicólogo "${formData.nome_completo}" criado com sucesso! Credenciais: Email: ${formData.email}, Senha: ${senha}`)
      
      setShowCreateModal(false)
      setFormData({ nome_completo: '', email: '' })
      fetchPsicologos()
    } catch (error) {
      console.error('Erro ao criar psicólogo:', error)
      const message = error?.message || 'Erro ao criar psicólogo. Tente novamente.'
      showError(message)
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (psicologo) => {
    setEditingPsicologo(psicologo)
    setFormData({
      nome_completo: psicologo.nome_completo || '',
      email: psicologo.email || ''
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Atualizar perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          nome_completo: formData.nome_completo
        })
        .eq('id', editingPsicologo.id)

      if (updateError) throw updateError

      success(`Psicólogo "${formData.nome_completo}" atualizado com sucesso!`)
      
      setShowEditModal(false)
      setEditingPsicologo(null)
      setFormData({ nome_completo: '', email: '' })
      fetchPsicologos()
    } catch (error) {
      console.error('Erro ao atualizar psicólogo:', error)
      const message = error?.message || 'Erro ao atualizar psicólogo. Tente novamente.'
      showError(message)
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (psicologo) => {
    if (!confirm(`Tem certeza que deseja excluir o psicólogo "${psicologo.nome_completo}"?\n\nEsta ação não pode ser desfeita e todos os dados relacionados serão removidos.`)) {
      return
    }

    try {
      // Deletar via Edge Function para garantir que todos os dados sejam removidos
      const { error: deleteError } = await supabase.functions.invoke('delete-psychologist', {
        body: { user_id: psicologo.id }
      })

      if (deleteError) throw deleteError

      success(`Psicólogo "${psicologo.nome_completo}" excluído com sucesso!`)
      fetchPsicologos()
    } catch (error) {
      console.error('Erro ao deletar psicólogo:', error)
      const message = error?.message || 'Erro ao deletar psicólogo. Tente novamente.'
      showError(message)
    }
  }

  const handleResetPassword = async (psicologo) => {
    setResettingPasswordFor(psicologo)
    setShowResetPasswordModal(true)
    setError('')
  }

  const confirmResetPassword = async () => {
    if (!resettingPasswordFor) return

    setError('')
    setResettingPassword(true)

    try {
      const novaSenha = generatePassword()

      const { data, error: resetError } = await supabase.functions.invoke('reset-psychologist-password', {
        body: {
          user_id: resettingPasswordFor.id,
          nova_senha: novaSenha
        }
      })

      if (resetError) throw resetError

      if (data?.error) {
        throw new Error(data.error)
      }

      success(`Senha do psicólogo "${resettingPasswordFor.nome_completo}" redefinida com sucesso! Nova senha: ${novaSenha}`)
      
      setShowResetPasswordModal(false)
      setResettingPasswordFor(null)
      fetchPsicologos()
    } catch (error) {
      console.error('Erro ao redefinir senha:', error)
      const message = error?.message || 'Erro ao redefinir senha. Tente novamente.'
      showError(message)
      setError(message)
    } finally {
      setResettingPassword(false)
    }
  }

  const togglePasswordVisibility = (psicologoId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [psicologoId]: !prev[psicologoId]
    }))
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              Painel Administrativo
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Gerenciar psicólogos do sistema
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-opacity-90 transition shadow-sm hover:shadow-md text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Novo Psicólogo
          </button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          />
        </div>

        {/* Lista de Psicólogos */}
        {filteredPsicologos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Nenhum psicólogo encontrado' : 'Nenhum psicólogo cadastrado'}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              {searchTerm 
                ? 'Tente buscar com outros termos' 
                : 'Comece adicionando seu primeiro psicólogo'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-opacity-90 transition text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Adicionar Psicólogo
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Senha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Cadastro
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPsicologos.map((psicologo) => (
                    <tr key={psicologo.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {psicologo.nome_completo}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {psicologo.email}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {psicologo.senha_inicial ? (
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-300">
                              {visiblePasswords[psicologo.id] ? psicologo.senha_inicial : '••••••••••••'}
                            </code>
                            <button
                              onClick={() => togglePasswordVisibility(psicologo.id)}
                              className="text-gray-400 hover:text-gray-600 transition p-1"
                              title={visiblePasswords[psicologo.id] ? "Ocultar senha" : "Mostrar senha"}
                            >
                              {visiblePasswords[psicologo.id] ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Não disponível</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(psicologo.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResetPassword(psicologo)}
                            className="text-blue-600 hover:text-blue-700 transition p-2 hover:bg-blue-50 rounded-lg"
                            title="Redefinir Senha"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(psicologo)}
                            className="text-primary hover:text-primary-dark transition p-2 hover:bg-primary bg-opacity-10 rounded-lg"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(psicologo)}
                            className="text-red-600 hover:text-red-700 transition p-2 hover:bg-red-50 rounded-lg"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Criar Psicólogo */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setFormData({ nome_completo: '', email: '' })
          setError('')
        }}
        title="Novo Psicólogo"
        size="md"
      >
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              name="nome_completo"
              value={formData.nome_completo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Uma senha aleatória será gerada e exibida após a criação
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false)
                setFormData({ nome_completo: '', email: '' })
                setError('')
              }}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Criar Psicólogo
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Psicólogo */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingPsicologo(null)
          setFormData({ nome_completo: '', email: '' })
          setError('')
        }}
        title="Editar Psicólogo"
        size="md"
      >
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              name="nome_completo"
              value={formData.nome_completo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              O email não pode ser alterado
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false)
                setEditingPsicologo(null)
                setFormData({ nome_completo: '', email: '' })
                setError('')
              }}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Redefinir Senha */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false)
          setResettingPasswordFor(null)
          setError('')
        }}
        title="Redefinir Senha"
        size="md"
      >
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {resettingPasswordFor && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Atenção:</strong> Uma nova senha será gerada automaticamente para{' '}
                <strong>{resettingPasswordFor.nome_completo}</strong>.
              </p>
              <p className="text-xs text-blue-700 mt-2">
                A senha atual será substituída e a nova senha será exibida após a confirmação.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setResettingPasswordFor(null)
                  setError('')
                }}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                disabled={resettingPassword}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmResetPassword}
                disabled={resettingPassword}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resettingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Redefinindo...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Confirmar Redefinição
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}

