import { supabase } from '../lib/supabase'
import type { WhatsAppInstance, EvolutionAPIConnectionState, SendMessageRequest, SetWebhookRequest } from '../types/whatsapp'

const EDGE_FUNCTION_NAME = 'whatsapp-proxy'

// Cache para evitar eventos de desconexão duplicados
const lastDisconnectEvent: Map<string, number> = new Map() // instanceId -> timestamp
const DISCONNECT_EVENT_COOLDOWN = 30000 // 30 segundos entre eventos da mesma desconexão

// Função auxiliar para disparar evento de desconexão com cooldown
function dispatchDisconnectEvent(instanceId: string, message: string): void {
  const now = Date.now()
  const lastEventTime = lastDisconnectEvent.get(instanceId) || 0
  const timeSinceLastEvent = now - lastEventTime

  // Só disparar se passou o cooldown
  if (timeSinceLastEvent > DISCONNECT_EVENT_COOLDOWN) {
    console.log('Disparando evento de desconexão para instância:', instanceId)
    window.dispatchEvent(new CustomEvent('whatsapp-disconnected', {
      detail: { message }
    }))
    lastDisconnectEvent.set(instanceId, now)
  } else {
    console.log('Evento de desconexão ignorado (cooldown ativo, último evento há', Math.round(timeSinceLastEvent / 1000), 'segundos)')
  }
}

// Obter token de autenticação
async function getAuthToken(): Promise<string | null> {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Erro ao obter sessão:', error)
    return null
  }

  return session?.access_token || null
}

// Chamar Edge Function (com retry automático em caso de token expirado)
async function callEdgeFunction(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<Response> {
  const token = await getAuthToken()
  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const url = `${supabaseUrl}/functions/v1/${EDGE_FUNCTION_NAME}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  // Se recebeu 401 e ainda não tentou renovar, tentar obter nova sessão e refazer a requisição
  if (response.status === 401 && retryCount === 0) {
    console.log('Token expirado (401), tentando obter nova sessão...')

    // Forçar atualização da sessão chamando getUser (isso pode acionar renovação automática)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Erro ao obter usuário após 401:', userError)
      return response // Retornar a resposta original
    }

    // Obter nova sessão (pode ter sido renovada automaticamente)
    const { data: { session: newSession }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !newSession?.access_token) {
      console.error('Erro ao obter nova sessão após 401:', sessionError)
      return response // Retornar a resposta original
    }

    // Refazer a requisição com o novo token
    console.log('Nova sessão obtida, refazendo requisição...')
    return callEdgeFunction(endpoint, options, retryCount + 1)
  }

  return response
}

// Buscar instância do psicólogo
export async function getInstance(psicologoId: string): Promise<WhatsAppInstance | null> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('psicologo_id', psicologoId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum registro encontrado
        return null
      }
      throw error
    }

    return data as WhatsAppInstance
  } catch (error) {
    console.error('Erro ao buscar instância:', error)
    throw error
  }
}

// Criar instância
export async function createInstance(psicologoId: string, instanceName?: string): Promise<WhatsAppInstance> {
  try {
    const name = instanceName || `psicologo-${psicologoId}`

    const response = await callEdgeFunction('/instance/create', {
      method: 'POST',
      body: JSON.stringify({ instanceName: name }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao criar instância')
    }

    const data = await response.json()
    return data as WhatsAppInstance
  } catch (error) {
    console.error('Erro ao criar instância:', error)
    throw error
  }
}

// Obter QR code
export async function getQRCode(instanceName: string): Promise<string | null> {
  try {
    const response = await callEdgeFunction(`/instance/connect/${instanceName}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao obter QR code')
    }

    const data = await response.json()
    console.log('Resposta Evolution API para QR code:', data)

    // A Evolution API pode retornar o QR code em diferentes formatos
    // Tentar diferentes propriedades possíveis

    // Se for string direta (base64)
    if (typeof data === 'string') {
      // Verificar se é base64 válido
      if (data.startsWith('data:image') || data.length > 100) {
        // Remover prefixo data:image se existir
        const base64 = data.includes(',') ? data.split(',')[1] : data
        return base64
      }
      return data
    }

    // Verificar propriedades comuns
    if (data.base64) {
      const base64 = typeof data.base64 === 'string' ? data.base64 : data.base64.code || data.base64.base64
      if (base64) {
        // Remover prefixo se existir
        return base64.includes(',') ? base64.split(',')[1] : base64
      }
    }

    if (data.code) {
      return data.code
    }

    if (data.qrcode) {
      if (typeof data.qrcode === 'string') {
        return data.qrcode.includes(',') ? data.qrcode.split(',')[1] : data.qrcode
      }
      if (data.qrcode.base64) {
        return data.qrcode.base64.includes(',') ? data.qrcode.base64.split(',')[1] : data.qrcode.base64
      }
      if (data.qrcode.code) {
        return data.qrcode.code
      }
    }

    // Verificar se há uma propriedade 'qrcode' como objeto aninhado
    if (data.qrcode?.base64) {
      const base64 = data.qrcode.base64
      return base64.includes(',') ? base64.split(',')[1] : base64
    }

    if (data.qrcode?.code) {
      return data.qrcode.code
    }

    // Verificar se há uma propriedade 'qrcode' no primeiro nível
    if (data.instance?.qrcode) {
      const qrcode = data.instance.qrcode
      if (typeof qrcode === 'string') {
        return qrcode.includes(',') ? qrcode.split(',')[1] : qrcode
      }
      return qrcode.base64 || qrcode.code || null
    }

    console.warn('Formato de QR code não reconhecido. Dados recebidos:', JSON.stringify(data).substring(0, 500))
    return null
  } catch (error) {
    console.error('Erro ao obter QR code:', error)
    throw error
  }
}

// Obter status de conexão
export async function getConnectionState(instanceName: string): Promise<EvolutionAPIConnectionState | null> {
  try {
    const response = await callEdgeFunction(`/instance/connectionState/${instanceName}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao obter status de conexão')
    }

    const data = await response.json()
    console.log('Resposta connectionState da Evolution API:', data)
    return data as EvolutionAPIConnectionState
  } catch (error) {
    console.error('Erro ao obter status de conexão:', error)
    throw error
  }
}

// Deletar instância
export async function deleteInstance(instanceName: string, instanceId: string): Promise<void> {
  try {
    const response = await callEdgeFunction(`/instance/delete/${instanceName}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))

      // Se ainda recebeu 401 após tentativa de renovação, o usuário precisa fazer login novamente
      if (response.status === 401) {
        console.error('Token ainda inválido após tentativa de renovação')
        throw new Error('Sua sessão expirou. Por favor, faça login novamente.')
      }

      throw new Error(errorData.error || 'Erro ao deletar instância')
    }

    // Instância já foi deletada do banco pela Edge Function
  } catch (error: any) {
    console.error('Erro ao deletar instância:', error)

    // Se o erro já é uma instância de Error, apenas relançar
    if (error instanceof Error) {
      throw error
    }

    // Caso contrário, criar erro genérico
    throw new Error(error?.message || 'Erro ao deletar instância')
  }
}

// Enviar mensagem
export async function sendMessage(instanceName: string, to: string, message: string): Promise<void> {
  try {
    const payload: SendMessageRequest = {
      number: to,
      text: message,
    }

    const response = await callEdgeFunction(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao enviar mensagem')
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    throw error
  }
}

// Configurar webhook
export async function setWebhook(instanceName: string, webhookUrl: string): Promise<void> {
  try {
    const payload: SetWebhookRequest = {
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'MESSAGES_DELETE', 'SEND_MESSAGE', 'CONNECTION_UPDATE', 'CALLBACK_QUERY', 'STATUS_INSTANCE'],
    }

    const response = await callEdgeFunction(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao configurar webhook')
    }
  } catch (error) {
    console.error('Erro ao configurar webhook:', error)
    throw error
  }
}

// Atualizar webhook no banco
export async function updateInstanceWebhook(instanceId: string, webhookUrl: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('whatsapp_instances')
      .update({ webhook_url: webhookUrl })
      .eq('id', instanceId)

    if (error) throw error
  } catch (error) {
    console.error('Erro ao atualizar webhook no banco:', error)
    throw error
  }
}

// Criar notificação de desconexão do WhatsApp
export async function createDisconnectNotification(psicologoId: string, instanceName: string): Promise<void> {
  try {
    console.log('Criando notificação de desconexão para:', { psicologoId, instanceName })
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        psicologo_id: psicologoId,
        type: 'whatsapp_disconnect',
        message: `Sua conexão WhatsApp foi desconectada. Por favor, reconecte seu WhatsApp nas configurações.`,
        sessao_id: null,
      })
      .select()

    if (error) {
      console.error('Erro ao criar notificação de desconexão:', error)
      // Não lançar erro para não interromper o fluxo principal
    } else {
      console.log('Notificação de desconexão criada:', data)
    }
  } catch (error) {
    console.error('Erro ao criar notificação de desconexão:', error)
    // Não lançar erro para não interromper o fluxo principal
  }
}

// Sincronizar status da instância
export async function syncInstanceStatus(psicologoId: string): Promise<WhatsAppInstance | null> {
  try {
    const instance = await getInstance(psicologoId)
    if (!instance) {
      return null
    }

    // Guardar status anterior para detectar desconexão
    const previousStatus = instance.status

    let connectionState: EvolutionAPIConnectionState | null = null
    try {
      connectionState = await getConnectionState(instance.instance_name)
    } catch (error: any) {
      // Se houver erro ao obter status (ex: instância não existe mais na Evolution API)
      // e estava conectado, considerar como desconexão
      if (previousStatus === 'connected') {
        console.log('Erro ao obter status - possivel desconexão:', error)
        // Criar notificação e deletar instância
        await createDisconnectNotification(psicologoId, instance.instance_name)

        // Disparar evento para mostrar toast no layout (com cooldown)
        dispatchDisconnectEvent(instance.id, 'Sua conexão WhatsApp foi desconectada. Por favor, reconecte nas configurações.')

        try {
          await deleteInstance(instance.instance_name, instance.id)
          console.log('Instância deletada automaticamente após erro ao obter status')
        } catch (deleteError) {
          console.error('Erro ao deletar instância após erro:', deleteError)
        }
        return null
      }
      // Se não estava conectado, apenas retornar a instância atual
      return instance
    }

    if (!connectionState) {
      // Se connectionState for null e estava conectado, considerar desconexão
      if (previousStatus === 'connected') {
        console.log('Status null - possivel desconexão')
        await createDisconnectNotification(psicologoId, instance.instance_name)

        // Disparar evento para mostrar toast no layout (com cooldown)
        dispatchDisconnectEvent(instance.id, 'Sua conexão WhatsApp foi desconectada. Por favor, reconecte nas configurações.')

        try {
          await deleteInstance(instance.instance_name, instance.id)
          console.log('Instância deletada automaticamente após status null')
        } catch (deleteError) {
          console.error('Erro ao deletar instância após status null:', deleteError)
        }
        return null
      }
      return instance
    }

    console.log('Estado da Evolution API:', connectionState)

    // Mapear estado da Evolution API para nosso status
    let status: WhatsAppInstance['status'] = 'disconnected'
    let phoneNumber: string | undefined = undefined
    let errorMessage: string | undefined = undefined

    // A Evolution API pode retornar o estado de diferentes formas
    // Verificar diferentes possíveis estruturas de resposta
    const rawState = connectionState.state ||
                     (connectionState as any).instance?.state ||
                     (connectionState as any).state ||
                     (connectionState as any).connection?.state

    const state = typeof rawState === 'string' ? rawState.toLowerCase() : rawState

    console.log('Estado processado:', state, 'Tipo:', typeof state)

    if (state === 'open' || state === 'connected') {
      status = 'connected'
      // Tentar obter número do telefone de diferentes lugares
      phoneNumber = connectionState.status ||
                   (connectionState as any).instance?.phone ||
                   (connectionState as any).phone ||
                   (connectionState as any).instance?.phoneNumber ||
                   (connectionState as any).phoneNumber
      console.log('Status mapeado para: connected, phoneNumber:', phoneNumber)
    } else if (state === 'connecting') {
      status = 'connecting'
      console.log('Status mapeado para: connecting')
    } else if (state === 'close' || state === 'closed') {
      status = 'disconnected'
      errorMessage = 'Conexão fechada'
      console.log('Status mapeado para: disconnected')

      // Se a conexão está fechada, sempre deletar a instância
      // independente do status anterior
      console.log('CONEXÃO FECHADA DETECTADA! Deletando instância...')

      // Criar notificação de desconexão se estava conectado
      if (previousStatus === 'connected') {
        try {
          await createDisconnectNotification(psicologoId, instance.instance_name)
          console.log('Notificação de desconexão criada com sucesso')

          // Disparar evento para mostrar toast no layout (com cooldown)
          dispatchDisconnectEvent(instance.id, 'Sua conexão WhatsApp foi desconectada. Por favor, reconecte nas configurações.')
        } catch (notifError) {
          console.error('Erro ao criar notificação:', notifError)
        }
      }

      // Sempre deletar instância quando conexão está fechada
      try {
        await deleteInstance(instance.instance_name, instance.id)
        console.log('Instância deletada automaticamente após conexão fechada')
      } catch (deleteError) {
        console.error('Erro ao deletar instância após conexão fechada:', deleteError)
      }

      // Retornar null pois a instância foi deletada
      return null
    } else {
      // Se não reconhecer, verificar se há outras propriedades que indiquem conexão
      console.warn('Estado não reconhecido:', state, 'Dados completos:', JSON.stringify(connectionState))
      // Tentar inferir do objeto completo
      if ((connectionState as any).instance?.connected || (connectionState as any).connected) {
        status = 'connected'
      }
    }

    // Detectar desconexão: se estava conectado e agora está desconectado
    const wasDisconnected = previousStatus === 'connected' && status === 'disconnected'

    console.log('Verificação de desconexão:', {
      previousStatus,
      currentStatus: status,
      wasDisconnected,
      instanceName: instance.instance_name
    })

    if (wasDisconnected) {
      console.log('DESCONEXÃO DETECTADA! Criando notificação e deletando instância...')

      // Criar notificação de desconexão
      try {
        await createDisconnectNotification(psicologoId, instance.instance_name)
        console.log('Notificação de desconexão criada com sucesso')

        // Disparar evento para mostrar toast no layout (com cooldown)
        dispatchDisconnectEvent(instance.id, 'Sua conexão WhatsApp foi desconectada. Por favor, reconecte nas configurações.')
      } catch (notifError) {
        console.error('Erro ao criar notificação:', notifError)
      }

      // Deletar instância automaticamente
      try {
        await deleteInstance(instance.instance_name, instance.id)
        console.log('Instância deletada automaticamente após desconexão')
      } catch (deleteError) {
        console.error('Erro ao deletar instância após desconexão:', deleteError)
        // Continuar mesmo se a deleção falhar
      }

      // Retornar null pois a instância foi deletada
      return null
    }

    // Só atualizar no banco se o status ou outras informações mudaram
    const statusChanged = previousStatus !== status
    const phoneChanged = phoneNumber && phoneNumber !== instance.phone_number
    const errorChanged = errorMessage !== instance.error_message

    // Se nada mudou, apenas atualizar last_status_check sem disparar UPDATE completo
    if (!statusChanged && !phoneChanged && !errorChanged) {
      // Atualizar apenas last_status_check silenciosamente (sem disparar Realtime)
      await supabase
        .from('whatsapp_instances')
        .update({ last_status_check: new Date().toISOString() })
        .eq('id', instance.id)

      console.log('Status não mudou, apenas atualizando last_status_check')
      return instance
    }

    // Atualizar instância no banco apenas se houver mudanças
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .update({
        status,
        phone_number: phoneNumber || instance.phone_number,
        error_message: errorMessage,
        last_status_check: new Date().toISOString(),
      })
      .eq('id', instance.id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Erro ao atualizar status no banco:', error)
      throw error
    }

    // Se não encontrou a instância (foi deletada), retornar null
    if (!data) {
      console.log('Instância não encontrada após atualização - pode ter sido deletada')
      return null
    }

    return data as WhatsAppInstance
  } catch (error) {
    console.error('Erro ao sincronizar status:', error)
    throw error
  }
}

// Atualizar QR code no banco
export async function updateQRCode(instanceId: string, qrCode: string): Promise<void> {
  try {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 2) // QR code expira em 2 minutos

    const { error } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: qrCode,
        qr_code_expires_at: expiresAt.toISOString(),
      })
      .eq('id', instanceId)

    if (error) throw error
  } catch (error) {
    console.error('Erro ao atualizar QR code no banco:', error)
    throw error
  }
}
