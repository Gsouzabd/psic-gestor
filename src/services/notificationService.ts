import { supabase } from '../lib/supabase'

// Webhook n8n configuration
const WEBHOOK_USERNAME = 'pscigestor'
const WEBHOOK_PASSWORD = 'psic64034@#$%T'

// Obter URL do webhook global
async function getWebhookUrl(): Promise<string> {
  try {
    // Buscar webhook URL usando RPC function (bypass RLS)
    const { data, error } = await supabase.rpc('get_webhook_url')

    if (error) {
      console.error('Erro ao buscar webhook via RPC:', error)
      // Fallback para URL padrão
      return 'https://n8n-venturize-n8n.8tlzgn.easypanel.host/webhook/notify-paciente-psic-gestor'
    }

    return data || 'https://n8n-venturize-n8n.8tlzgn.easypanel.host/webhook/notify-paciente-psic-gestor'
  } catch (error) {
    console.error('Erro ao obter webhook URL:', error)
    // Fallback para URL padrão
    return 'https://n8n-venturize-n8n.8tlzgn.easypanel.host/webhook/notify-paciente-psic-gestor'
  }
}

// Gerar ou obter token de notificação para uma sessão
async function getOrCreateNotificationToken(sessaoId: string): Promise<string> {
  try {
    // Buscar sessão para verificar se já tem token
    const { data: sessao, error } = await supabase
      .from('sessoes_agendadas')
      .select('notification_token')
      .eq('id', sessaoId)
      .single()

    if (error) throw error

    // Se já tem token, retornar
    if (sessao?.notification_token) {
      return sessao.notification_token
    }

    // Gerar novo token único usando crypto.randomUUID() (nativo do navegador)
    const token = crypto.randomUUID()

    // Salvar token na sessão
    const { error: updateError } = await supabase
      .from('sessoes_agendadas')
      .update({ notification_token: token })
      .eq('id', sessaoId)

    if (updateError) throw updateError

    return token
  } catch (error) {
    console.error('Erro ao gerar/obter token de notificação:', error)
    throw error
  }
}

// Obter URL base da aplicação
function getBaseUrl(): string {
  // Em desenvolvimento, usar localhost
  // @ts-ignore - import.meta.env é válido em Vite
  if (import.meta.env.DEV) {
    return 'http://localhost:5173'
  }
  // Em produção, usar window.location.origin
  return window.location.origin
}

// Notificar paciente sobre sessão agendada
export async function notifyPatient(sessaoId: string, useApelido?: boolean): Promise<void> {
  try {
    // 1. Buscar dados da sessão e paciente
    const { data: sessao, error: sessaoError } = await supabase
      .from('sessoes_agendadas')
      .select(`
        id,
        data,
        hora,
        paciente_id,
        tipo_consulta,
        link_meet,
        pacientes!inner (
          id,
          nome_completo,
          apelido,
          telefone,
          psicologo_id
        )
      `)
      .eq('id', sessaoId)
      .single()

    if (sessaoError || !sessao) {
      throw new Error('Sessão não encontrada')
    }

    // O Supabase retorna pacientes como objeto único quando usado com !inner e .single()
    const paciente = sessao.pacientes as any
    if (!paciente) {
      throw new Error('Paciente não encontrado')
    }

    const psicologoId = paciente.psicologo_id

    // 2. Buscar instância WhatsApp do psicólogo
    const { data: whatsappInstance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, status')
      .eq('psicologo_id', psicologoId)
      .eq('status', 'connected')
      .maybeSingle()

    if (instanceError) {
      console.error('Erro ao buscar instância WhatsApp:', instanceError)
    }

    if (!whatsappInstance) {
      throw new Error('WhatsApp não está conectado. Conecte seu WhatsApp nas configurações.')
    }

    // 3. Buscar credenciais Evolution API
    const { data: configData, error: configError } = await supabase.rpc('get_evolution_api_config')

    if (configError || !configData || !configData[0]?.key) {
      throw new Error('Evolution API não está configurada. Configure no painel Admin.')
    }

    const apikey = configData[0].key

    // 4. Gerar/obter token de confirmação
    const token = await getOrCreateNotificationToken(sessaoId)

    // 5. Montar URL de confirmação
    const baseUrl = getBaseUrl()
    const urlConfirm = `${baseUrl}/confirmar-sessao/${sessaoId}?token=${token}`

    // 6. Determinar qual nome usar (apelido ou nome_completo)
    let pacienteNome = paciente.nome_completo
    if (useApelido && paciente.apelido && paciente.apelido.trim() !== '') {
      pacienteNome = paciente.apelido
    }

    // 7. Preparar payload
    const payload: any = {
      psicologo_id: psicologoId,
      paciente_nome: pacienteNome,
      paciente_telefone: paciente.telefone || '',
      sessao_id: sessaoId,
      sessao_data: sessao.data,
      sessao_hora: sessao.hora,
      url_confirm: urlConfirm,
      apikey: apikey,
      instance_name: whatsappInstance.instance_name
    }

    // Incluir link do Google Meet se a sessão for online e tiver o link
    if (sessao.tipo_consulta === 'online' && sessao.link_meet) {
      payload.link_meet = sessao.link_meet
    }

    // 8. Obter URL do webhook global
    const webhookUrl = await getWebhookUrl()
    
    // 9. Enviar POST para webhook n8n com Basic Auth
    const credentials = btoa(`${WEBHOOK_USERNAME}:${WEBHOOK_PASSWORD}`)
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro ao enviar notificação:', errorText)
      throw new Error(`Erro ao enviar notificação: ${response.status} ${response.statusText}`)
    }

    console.log('Notificação enviada com sucesso para o webhook n8n')
  } catch (error) {
    console.error('Erro ao notificar paciente:', error)
    throw error
  }
}

