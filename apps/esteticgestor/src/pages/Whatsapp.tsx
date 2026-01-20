import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuth, useToast, useNotifications, supabase, whatsappService } from '@gestor/core'
import { MessageSquare, QrCode, RefreshCw, Trash2, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'

interface WhatsAppInstance {
  id: string
  instance_name: string
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
  qr_code?: string
  phone_number?: string
  error_message?: string
}

export default function Whatsapp() {
  const { user, profile } = useAuth()
  const { success, error: showError } = useToast()
  const { refreshNotifications } = useNotifications()
  
  // Estados WhatsApp
  const [whatsappInstance, setWhatsappInstance] = useState<WhatsAppInstance | null>(null)
  const [whatsappLoading, setWhatsappLoading] = useState(false)
  const [whatsappError, setWhatsappError] = useState('')
  const [evolutionApiConfigured, setEvolutionApiConfigured] = useState(false)

  // Verificar se Evolution API está configurada e carregar instância
  useEffect(() => {
    if (user && profile) {
      checkEvolutionApiConfig()
      loadWhatsAppInstance()
    }
  }, [user, profile])

  // Polling automático quando status = connecting ou connected
  // Monitora para detectar desconexões
  useEffect(() => {
    if (!whatsappInstance || (whatsappInstance.status !== 'connecting' && whatsappInstance.status !== 'connected')) {
      return
    }

    // Intervalo diferente para connecting (mais frequente) e connected (menos frequente)
    const intervalTime = whatsappInstance.status === 'connecting' ? 5000 : 30000

    const interval = setInterval(async () => {
      try {
        const updatedInstance = await syncWhatsAppStatus()
        // Se a instância foi deletada (retornou null), atualizar estado
        if (!updatedInstance && whatsappInstance) {
          setWhatsappInstance(null)
          // Recarregar notificações para mostrar a nova notificação de desconexão
          if (refreshNotifications) {
            refreshNotifications()
          }
          showError('Sua conexão WhatsApp foi desconectada. Por favor, reconecte nas configurações.')
        }
      } catch (error) {
        console.error('Erro no polling:', error)
      }
    }, intervalTime)

    return () => clearInterval(interval)
  }, [whatsappInstance?.status, whatsappInstance?.id, refreshNotifications, showError])

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
        setWhatsappInstance(instance as WhatsAppInstance)
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
        setWhatsappInstance(updatedInstance as WhatsAppInstance)
        
        // Se status é connecting, tentar obter QR code
        if (updatedInstance.status === 'connecting' || !updatedInstance.qr_code) {
          try {
            const qrCode = await whatsappService.getQRCode(updatedInstance.instance_name)
            if (qrCode) {
              await whatsappService.updateQRCode(updatedInstance.id, qrCode)
              // Recarregar novamente para ter o QR code atualizado
              const instanceWithQR = await whatsappService.getInstance(profile.id)
              if (instanceWithQR) {
                setWhatsappInstance(instanceWithQR as WhatsAppInstance)
              }
            }
          } catch (qrError) {
            console.warn('Erro ao obter QR code inicial, será obtido no polling:', qrError)
            // Não falhar a criação se o QR code não vier imediatamente
          }
        }
      } else {
        setWhatsappInstance(instance as WhatsAppInstance)
      }
      
      success('Instância WhatsApp criada com sucesso! Escaneie o QR code para conectar.')
    } catch (error: any) {
      const message = error?.message || 'Erro ao criar instância WhatsApp'
      setWhatsappError(message)
      showError(message)
    } finally {
      setWhatsappLoading(false)
    }
  }

  // Sincronizar status
  const syncWhatsAppStatus = async (): Promise<WhatsAppInstance | null> => {
    if (!profile?.id) return null

    try {
      const instance = await whatsappService.syncInstanceStatus(profile.id)
      if (instance) {
        setWhatsappInstance(instance as WhatsAppInstance)
        
        // Se status é connecting e não tem QR code, tentar obter
        if (instance.status === 'connecting' && !instance.qr_code) {
          try {
            const qrCode = await whatsappService.getQRCode(instance.instance_name)
            if (qrCode) {
              await whatsappService.updateQRCode(instance.id, qrCode)
              // Recarregar instância para ter o QR code atualizado
              const updatedInstance = await whatsappService.getInstance(profile.id)
              if (updatedInstance) {
                setWhatsappInstance(updatedInstance as WhatsAppInstance)
              }
            }
          } catch (qrError) {
            console.warn('Erro ao obter QR code durante sincronização:', qrError)
          }
        }
        return instance as WhatsAppInstance
      } else {
        // Instância foi deletada (provavelmente por desconexão)
        setWhatsappInstance(null)
        return null
      }
    } catch (error) {
      console.error('Erro ao sincronizar status:', error)
      return null
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
    } catch (error: any) {
      const message = error?.message || 'Erro ao desconectar WhatsApp'
      setWhatsappError(message)
      showError(message)
    } finally {
      setWhatsappLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            WhatsApp
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Conecte seu WhatsApp para receber e enviar notificações aos seus pacientes
          </p>
        </div>

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
                          const updated = await whatsappService.getInstance(profile?.id || '')
                          if (updated) {
                            setWhatsappInstance(updated as WhatsAppInstance)
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
                          const updated = await whatsappService.getInstance(profile?.id || '')
                          if (updated) {
                            setWhatsappInstance(updated as WhatsAppInstance)
                            success('QR code obtido com sucesso!')
                          }
                        } else {
                          showError('Não foi possível obter o QR code. Tente novamente.')
                        }
                      } catch (error: any) {
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
    </Layout>
  )
}
