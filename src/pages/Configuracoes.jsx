import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, MessageSquare, QrCode, RefreshCw, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import * as whatsappService from '../services/whatsappService'

export default function Configuracoes() {
  const { user, profile } = useAuth()
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Estados WhatsApp
  const [whatsappInstance, setWhatsappInstance] = useState(null)
  const [whatsappLoading, setWhatsappLoading] = useState(false)
  const [whatsappError, setWhatsappError] = useState('')
  const [evolutionApiConfigured, setEvolutionApiConfigured] = useState(false)
  
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

  // Verificar se Evolution API está configurada e carregar instância
  useEffect(() => {
    if (user && profile) {
      checkEvolutionApiConfig()
      loadWhatsAppInstance()
    }
  }, [user, profile])

  // Polling automático quando status = connecting
  useEffect(() => {
    if (!whatsappInstance || whatsappInstance.status !== 'connecting') {
      return
    }

    const interval = setInterval(async () => {
      try {
        await syncWhatsAppStatus()
      } catch (error) {
        console.error('Erro no polling:', error)
      }
    }, 5000) // A cada 5 segundos

    return () => clearInterval(interval)
  }, [whatsappInstance?.status])

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

  // Verificar se Evolution API está configurada
  const checkEvolutionApiConfig = async () => {
    try {
      // Usar função RPC que verifica se está configurado sem expor valores
      const { data, error } = await supabase.rpc('check_evolution_api_configured')

      if (error) {
        // Se a função não existir ou houver erro, tentar método alternativo
        console.warn('Erro ao verificar via RPC, tentando método alternativo:', error)
        // Tentar verificar via query direta (pode falhar por RLS)
        const { data: configData, error: configError } = await supabase
          .from('system_config')
          .select('key, value')
          .in('key', ['evolution_api_url', 'evolution_api_key'])

        if (configError) {
          // Se falhar, assumir que não está configurado
          setEvolutionApiConfigured(false)
          return
        }

        const hasUrl = configData?.some(item => item.key === 'evolution_api_url' && item.value)
        const hasKey = configData?.some(item => item.key === 'evolution_api_key' && item.value)
        setEvolutionApiConfigured(hasUrl && hasKey)
        return
      }

      setEvolutionApiConfigured(data === true)
    } catch (error) {
      console.error('Erro ao verificar configuração Evolution API:', error)
      setEvolutionApiConfigured(false)
    }
  }

  // Carregar instância WhatsApp
  const loadWhatsAppInstance = async () => {
    if (!profile?.id) return

    try {
      setWhatsappLoading(true)
      const instance = await whatsappService.getInstance(profile.id)
      if (instance) {
        setWhatsappInstance(instance)
        // Sincronizar status automaticamente ao carregar
        try {
          await syncWhatsAppStatus()
        } catch (syncError) {
          console.warn('Erro ao sincronizar status ao carregar:', syncError)
        }
      } else {
        setWhatsappInstance(null)
      }
    } catch (error) {
      console.error('Erro ao carregar instância WhatsApp:', error)
      setWhatsappInstance(null)
    } finally {
      setWhatsappLoading(false)
    }
  }

  // Criar instância WhatsApp
  const createWhatsAppInstance = async () => {
    if (!profile?.id) return

    try {
      setWhatsappLoading(true)
      setWhatsappError('')
      
      const instance = await whatsappService.createInstance(profile.id)
      
      // Aguardar um pouco para a Evolution API processar
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Recarregar instância do banco para ter os dados atualizados
      const updatedInstance = await whatsappService.getInstance(profile.id)
      if (updatedInstance) {
        setWhatsappInstance(updatedInstance)
        
        // Se status é connecting, tentar obter QR code
        if (updatedInstance.status === 'connecting' || !updatedInstance.qr_code) {
          try {
            const qrCode = await whatsappService.getQRCode(updatedInstance.instance_name)
            if (qrCode) {
              await whatsappService.updateQRCode(updatedInstance.id, qrCode)
              // Recarregar novamente para ter o QR code atualizado
              const instanceWithQR = await whatsappService.getInstance(profile.id)
              if (instanceWithQR) {
                setWhatsappInstance(instanceWithQR)
              }
            }
          } catch (qrError) {
            console.warn('Erro ao obter QR code inicial, será obtido no polling:', qrError)
            // Não falhar a criação se o QR code não vier imediatamente
          }
        }
      } else {
        setWhatsappInstance(instance)
      }
      
      success('Instância WhatsApp criada com sucesso! Escaneie o QR code para conectar.')
    } catch (error) {
      const message = error?.message || 'Erro ao criar instância WhatsApp'
      setWhatsappError(message)
      showError(message)
    } finally {
      setWhatsappLoading(false)
    }
  }

  // Sincronizar status
  const syncWhatsAppStatus = async () => {
    if (!profile?.id) return

    try {
      const instance = await whatsappService.syncInstanceStatus(profile.id)
      if (instance) {
        setWhatsappInstance(instance)
        
        // Se status é connecting e não tem QR code, tentar obter
        if (instance.status === 'connecting' && !instance.qr_code) {
          try {
            const qrCode = await whatsappService.getQRCode(instance.instance_name)
            if (qrCode) {
              await whatsappService.updateQRCode(instance.id, qrCode)
              // Recarregar instância para ter o QR code atualizado
              const updatedInstance = await whatsappService.getInstance(profile.id)
              if (updatedInstance) {
                setWhatsappInstance(updatedInstance)
              }
            }
          } catch (qrError) {
            console.warn('Erro ao obter QR code durante sincronização:', qrError)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar status:', error)
    }
  }

  // Deletar instância
  const deleteWhatsAppInstance = async () => {
    if (!whatsappInstance) return

    if (!confirm('Tem certeza que deseja desconectar o WhatsApp? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setWhatsappLoading(true)
      setWhatsappError('')
      
      await whatsappService.deleteInstance(whatsappInstance.instance_name, whatsappInstance.id)
      setWhatsappInstance(null)
      success('WhatsApp desconectado com sucesso!')
    } catch (error) {
      const message = error?.message || 'Erro ao desconectar WhatsApp'
      setWhatsappError(message)
      showError(message)
    } finally {
      setWhatsappLoading(false)
    }
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

        {/* Seção Notificações WhatsApp */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Notificações WhatsApp
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Conecte seu WhatsApp para receber e enviar notificações aos seus pacientes
          </p>

          {!evolutionApiConfigured ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-900 mb-1">
                    Evolution API não configurada
                  </h3>
                  <p className="text-xs text-yellow-800 mb-3">
                    O administrador precisa configurar as credenciais da Evolution API no painel Admin antes de você poder conectar seu WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          ) : whatsappLoading && !whatsappInstance ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-3" />
              <p className="text-sm text-gray-600">Carregando...</p>
            </div>
          ) : !whatsappInstance ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-4">
                Você ainda não tem uma instância WhatsApp conectada. Clique no botão abaixo para criar e conectar.
              </p>
              {whatsappError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-800">{whatsappError}</span>
                </div>
              )}
              <button
                onClick={createWhatsAppInstance}
                disabled={whatsappLoading}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {whatsappLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Conectar WhatsApp
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              {whatsappError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-800">{whatsappError}</span>
                </div>
              )}

              {/* Status da Instância */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Status da Conexão</h3>
                  <div className="flex items-center gap-2">
                    {whatsappInstance.status === 'connected' && (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Conectado</span>
                      </>
                    )}
                    {whatsappInstance.status === 'connecting' && (
                      <>
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        <span className="text-sm font-medium text-blue-600">Conectando...</span>
                      </>
                    )}
                    {whatsappInstance.status === 'disconnected' && (
                      <>
                        <XCircle className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Desconectado</span>
                      </>
                    )}
                    {whatsappInstance.status === 'error' && (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-red-600">Erro</span>
                      </>
                    )}
                  </div>
                  {whatsappInstance.phone_number && (
                    <p className="text-xs text-gray-500 mt-1">
                      Número: {whatsappInstance.phone_number}
                    </p>
                  )}
                  {whatsappInstance.error_message && (
                    <p className="text-xs text-red-600 mt-1">
                      {whatsappInstance.error_message}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={syncWhatsAppStatus}
                    disabled={whatsappLoading}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                    title="Atualizar Status"
                  >
                    <RefreshCw className={`w-5 h-5 ${whatsappLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={deleteWhatsAppInstance}
                    disabled={whatsappLoading}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                    title="Desconectar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* QR Code */}
              {whatsappInstance.qr_code && (whatsappInstance.status === 'connecting' || whatsappInstance.status === 'disconnected') && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    QR Code para Conexão
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Escaneie este QR code com seu WhatsApp:
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={`data:image/png;base64,${whatsappInstance.qr_code}`}
                      alt="QR Code WhatsApp"
                      className="border-2 border-gray-300 rounded-lg p-4 bg-white max-w-xs"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    O QR code expira em aproximadamente 2 minutos. Se expirar, clique em "Atualizar Status" para obter um novo.
                  </p>
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={async () => {
                        if (!whatsappInstance) return
                        try {
                          setWhatsappLoading(true)
                          const qrCode = await whatsappService.getQRCode(whatsappInstance.instance_name)
                          if (qrCode) {
                            await whatsappService.updateQRCode(whatsappInstance.id, qrCode)
                            const updated = await whatsappService.getInstance(profile.id)
                            if (updated) {
                              setWhatsappInstance(updated)
                              success('QR code atualizado!')
                            }
                          }
                        } catch (error) {
                          showError('Erro ao atualizar QR code')
                        } finally {
                          setWhatsappLoading(false)
                        }
                      }}
                      disabled={whatsappLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 text-sm"
                    >
                      <RefreshCw className={`w-4 h-4 ${whatsappLoading ? 'animate-spin' : ''}`} />
                      Atualizar QR Code
                    </button>
                  </div>
                </div>
              )}

              {/* Se status é connecting/disconnected mas não tem QR code, mostrar botão para obter */}
              {(whatsappInstance.status === 'connecting' || whatsappInstance.status === 'disconnected') && !whatsappInstance.qr_code && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    QR Code para Conexão
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Clique no botão abaixo para obter o QR code e conectar seu WhatsApp:
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={async () => {
                        if (!whatsappInstance) return
                        try {
                          setWhatsappLoading(true)
                          const qrCode = await whatsappService.getQRCode(whatsappInstance.instance_name)
                          if (qrCode) {
                            await whatsappService.updateQRCode(whatsappInstance.id, qrCode)
                            const updated = await whatsappService.getInstance(profile.id)
                            if (updated) {
                              setWhatsappInstance(updated)
                              success('QR code obtido com sucesso!')
                            }
                          } else {
                            showError('Não foi possível obter o QR code. Tente novamente.')
                          }
                        } catch (error) {
                          const message = error?.message || 'Erro ao obter QR code'
                          showError(message)
                          setWhatsappError(message)
                        } finally {
                          setWhatsappLoading(false)
                        }
                      }}
                      disabled={whatsappLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 font-medium"
                    >
                      {whatsappLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Obtendo QR Code...
                        </>
                      ) : (
                        <>
                          <QrCode className="w-5 h-5" />
                          Obter QR Code
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
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

