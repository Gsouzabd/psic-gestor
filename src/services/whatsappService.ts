import { supabase } from '../lib/supabase'
import type { WhatsAppInstance, EvolutionAPIConnectionState, EvolutionAPIQRCode, SendMessageRequest, SetWebhookRequest } from '../types/whatsapp'

const EDGE_FUNCTION_NAME = 'whatsapp-proxy'

// Obter token de autenticação
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

// Chamar Edge Function
async function callEdgeFunction(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken()
  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const url = `${supabaseUrl}/functions/v1/${EDGE_FUNCTION_NAME}${endpoint}`

  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
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
      const error = await response.json()
      throw new Error(error.error || 'Erro ao deletar instância')
    }

    // Instância já foi deletada do banco pela Edge Function
  } catch (error) {
    console.error('Erro ao deletar instância:', error)
    throw error
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

// Sincronizar status da instância
export async function syncInstanceStatus(psicologoId: string): Promise<WhatsAppInstance | null> {
  try {
    const instance = await getInstance(psicologoId)
    if (!instance) {
      return null
    }

    const connectionState = await getConnectionState(instance.instance_name)
    if (!connectionState) {
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
    } else {
      // Se não reconhecer, verificar se há outras propriedades que indiquem conexão
      console.warn('Estado não reconhecido:', state, 'Dados completos:', JSON.stringify(connectionState))
      // Tentar inferir do objeto completo
      if ((connectionState as any).instance?.connected || (connectionState as any).connected) {
        status = 'connected'
      }
    }

    // Atualizar instância no banco
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
      .single()

    if (error) {
      console.error('Erro ao atualizar status no banco:', error)
      throw error
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

