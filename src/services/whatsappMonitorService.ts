import { supabase } from '../lib/supabase'
import * as whatsappService from './whatsappService'

// Serviço global para monitorar instâncias WhatsApp conectadas
// Roda em background mesmo quando a página de Configurações não está aberta

let monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()
let isMonitoring = false
let toastCallback: ((message: string, type: 'success' | 'error' | 'info') => void) | null = null
// Cache para evitar toasts duplicados da mesma desconexão
let lastDisconnectToast: Map<string, number> = new Map() // psicologoId -> timestamp
const DISCONNECT_TOAST_COOLDOWN = 30000 // 30 segundos entre toasts da mesma desconexão
// Flag para evitar múltiplas inicializações do Realtime
let realtimeChannel: any = null
let isRealtimeSetup = false

// Registrar callback para mostrar toasts
export function setToastCallback(callback: (message: string, type: 'success' | 'error' | 'info') => void) {
  toastCallback = callback
}

// Iniciar monitoramento para um psicólogo
export async function startMonitoring(psicologoId: string) {
  if (monitoringIntervals.has(psicologoId)) {
    console.log('ℹ️ Monitoramento já está ativo para psicólogo:', psicologoId)
    return
  }

  console.log('🚀 Iniciando monitoramento WhatsApp para psicólogo:', psicologoId)

  // Verificar status imediatamente
  await checkInstanceStatus(psicologoId)

  // Verificar a cada 60 segundos (aumentado para reduzir requisições)
  const interval = setInterval(async () => {
    console.log('⏰ Verificando status da instância (polling)...')
    await checkInstanceStatus(psicologoId)
  }, 60000) // 60 segundos

  monitoringIntervals.set(psicologoId, interval)
  isMonitoring = true
  console.log('✅ Monitoramento iniciado com sucesso. Intervalo: 60 segundos')
}

// Parar monitoramento para um psicólogo
export function stopMonitoring(psicologoId: string) {
  const interval = monitoringIntervals.get(psicologoId)
  if (interval) {
    clearInterval(interval)
    monitoringIntervals.delete(psicologoId)
    console.log('Monitoramento parado para psicólogo:', psicologoId)
  }
}

// Parar todo o monitoramento
export function stopAllMonitoring() {
  monitoringIntervals.forEach((interval, psicologoId) => {
    clearInterval(interval)
    console.log('Monitoramento parado para psicólogo:', psicologoId)
  })
  monitoringIntervals.clear()
  isMonitoring = false
  
  // Limpar Realtime também
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
    isRealtimeSetup = false
  }
}

// Verificar status da instância
async function checkInstanceStatus(psicologoId: string) {
  try {
    // Verificar primeiro se a instância ainda existe no banco antes de fazer requisição à API
    const { data: instanceData } = await supabase
      .from('whatsapp_instances')
      .select('id, status, instance_name, last_status_check')
      .eq('psicologo_id', psicologoId)
      .maybeSingle()
    
    if (!instanceData) {
      console.log('Instância não encontrada no banco - parando monitoramento')
      stopMonitoring(psicologoId)
      return
    }
    
    // Se está desconectado há mais de 1 hora, parar monitoramento para economizar recursos
    if (instanceData.status === 'disconnected' || instanceData.status === 'error') {
      if (instanceData.last_status_check) {
        const lastCheck = new Date(instanceData.last_status_check)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        if (lastCheck < oneHourAgo) {
          console.log('Instância desconectada há mais de 1 hora - parando monitoramento')
          stopMonitoring(psicologoId)
          return
        }
      }
    }
    
    // Só fazer sync se estiver connected ou connecting (economizar requisições)
    if (instanceData.status === 'connected' || instanceData.status === 'connecting') {
      const instance = await whatsappService.syncInstanceStatus(psicologoId)
      
      // Se retornou null, a instância foi deletada (provavelmente por desconexão)
      if (!instance) {
        console.log('Instância deletada após sync - parando monitoramento')
        stopMonitoring(psicologoId)
        return
      }
    } else {
      // Se está desconectado, apenas atualizar last_status_check sem fazer requisição à API
      console.log('Instância está disconnected/error - pulando requisição à API')
      await supabase
        .from('whatsapp_instances')
        .update({ last_status_check: new Date().toISOString() })
        .eq('id', instanceData.id)
    }
  } catch (error: any) {
    // Se o erro for PGRST116 (não encontrado), parar monitoramento
    if (error?.code === 'PGRST116' || error?.message?.includes('PGRST116')) {
      console.log('Instância não encontrada - parando monitoramento')
      stopMonitoring(psicologoId)
      return
    }
    console.error('Erro ao verificar status da instância:', error)
    // Não parar o monitoramento em caso de erro temporário
  }
}

// Inicializar monitoramento para o usuário atual
let isInitializing = false
export async function initializeMonitoring() {
  // Evitar múltiplas inicializações simultâneas
  if (isInitializing) {
    console.log('ℹ️ Inicialização já em andamento, ignorando...')
    return
  }
  
  // Se já está monitorando, não inicializar novamente
  if (monitoringIntervals.size > 0) {
    console.log('ℹ️ Monitoramento já está ativo, ignorando inicialização...')
    return
  }
  
  try {
    isInitializing = true
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.log('⚠️ Nenhuma sessão encontrada para inicializar monitoramento')
      isInitializing = false
      return
    }

    const psicologoId = session.user.id
    console.log('🔍 Verificando instância WhatsApp para iniciar monitoramento:', psicologoId)
    
    // Verificar se existe instância (connected ou connecting)
    try {
      const instance = await whatsappService.getInstance(psicologoId)
      
      if (instance) {
        console.log('📱 Instância encontrada:', { status: instance.status, instanceName: instance.instance_name })
        
        // Iniciar monitoramento se estiver connected, connecting ou disconnected
        // Se está disconnected mas tem last_status_check recente, pode ter desconectado recentemente
        if (instance.status === 'connected' || instance.status === 'connecting') {
          console.log('✅ Iniciando monitoramento para instância:', instance.status)
          await startMonitoring(psicologoId)
        } else if (instance.status === 'disconnected' || instance.status === 'error') {
          // Se está disconnected mas tem last_status_check recente (últimas 2 horas), monitorar
          // para detectar se reconecta ou se precisa notificar
          if (instance.last_status_check) {
            const lastCheck = new Date(instance.last_status_check)
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
            if (lastCheck > twoHoursAgo) {
              console.log('✅ Iniciando monitoramento para instância disconnected (recente):', instance.status)
              await startMonitoring(psicologoId)
            } else {
              console.log('ℹ️ Instância disconnected mas muito antiga, não requer monitoramento')
            }
          } else {
            console.log('✅ Iniciando monitoramento para instância disconnected (sem last_status_check)')
            await startMonitoring(psicologoId)
          }
        } else {
          console.log('ℹ️ Instância encontrada mas status não requer monitoramento:', instance.status)
        }
      } else {
        console.log('ℹ️ Nenhuma instância WhatsApp encontrada')
      }
    } catch (error: any) {
      // Se não encontrou instância (PGRST116), não há problema - apenas não iniciar monitoramento
      if (error?.code === 'PGRST116' || error?.message?.includes('PGRST116')) {
        console.log('ℹ️ Nenhuma instância WhatsApp encontrada - monitoramento não iniciado')
        return
      }
      console.error('❌ Erro ao buscar instância:', error)
      throw error
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar monitoramento:', error)
  } finally {
    isInitializing = false
  }
}

// Escutar mudanças na tabela whatsapp_instances usando Realtime
export function setupRealtimeMonitoring() {
  // Evitar múltiplas inicializações
  if (isRealtimeSetup && realtimeChannel) {
    console.log('ℹ️ Realtime já está configurado, retornando canal existente')
    return () => {
      // Cleanup vazio se já está configurado
    }
  }
  
  console.log('🔧 Configurando Realtime monitoring...')
  isRealtimeSetup = true
  const channel = supabase
    .channel('whatsapp_instances_monitoring')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'whatsapp_instances'
      },
      async (payload) => {
        console.log('Mudança detectada em whatsapp_instances:', payload)
        
        const psicologoId = payload.new?.psicologo_id || payload.old?.psicologo_id
        
        if (!psicologoId) return

        // Se foi atualizada, verificar se houve mudança de connected para disconnected
        if (payload.eventType === 'UPDATE') {
          const oldStatus = payload.old?.status
          const newStatus = payload.new?.status
          
          // Ignorar se o status não mudou realmente (pode ser apenas atualização de last_status_check)
          if (oldStatus === newStatus && oldStatus !== undefined) {
            console.log('ℹ️ UPDATE detectado mas status não mudou, ignorando:', { oldStatus, newStatus })
            return
          }
          
          console.log('Status mudou:', { oldStatus, newStatus, psicologoId, fullPayload: payload })
          
          // Verificar se mudou para disconnected/error
          const isNowDisconnected = newStatus === 'disconnected' || newStatus === 'error'
          
          // Se mudou para disconnected/error, mostrar toast (com proteção contra duplicatas)
          if (isNowDisconnected) {
            const now = Date.now()
            const lastToastTime = lastDisconnectToast.get(psicologoId) || 0
            const timeSinceLastToast = now - lastToastTime
            
            // Só mostrar toast se passou o cooldown
            if (timeSinceLastToast > DISCONNECT_TOAST_COOLDOWN) {
              console.log('🚨 STATUS DISCONNECTED/ERROR DETECTADO! Mostrando toast...')
              
              // SEMPRE mostrar toast/notice no layout (canto superior direito)
              const disconnectMessage = 'Sua conexão WhatsApp foi desconectada. Por favor, reconecte nas configurações.'
              
              console.log('🔔 Tentando exibir toast. Callback disponível?', !!toastCallback)
              
              if (toastCallback) {
                try {
                  toastCallback(disconnectMessage, 'error')
                  lastDisconnectToast.set(psicologoId, now)
                  console.log('✅ Toast de desconexão chamado via callback')
                } catch (error) {
                  console.error('❌ Erro ao chamar toastCallback:', error)
                  // Fallback para evento customizado
                  window.dispatchEvent(new CustomEvent('whatsapp-disconnected', {
                    detail: { message: disconnectMessage }
                  }))
                  lastDisconnectToast.set(psicologoId, now)
                }
              } else {
                // Se não há callback, disparar evento customizado
                console.log('⚠️ Callback não disponível, usando evento customizado')
                window.dispatchEvent(new CustomEvent('whatsapp-disconnected', {
                  detail: { message: disconnectMessage }
                }))
                lastDisconnectToast.set(psicologoId, now)
                console.log('✅ Toast de desconexão disparado via evento customizado')
              }
            } else {
              console.log('⏭️ Toast de desconexão ignorado (cooldown ativo, último toast há', Math.round(timeSinceLastToast / 1000), 'segundos)')
            }
            
            // Verificar se estava connected antes para criar notificação
            let shouldCreateNotification = false
            
            if (oldStatus === 'connected') {
              shouldCreateNotification = true
            } else if (oldStatus === undefined) {
              // Se oldStatus não está disponível, verificar se há uma notificação recente
              try {
                const { supabase } = await import('../lib/supabase')
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
                
                const { data: recentNotif } = await supabase
                  .from('notifications')
                  .select('id, created_at')
                  .eq('psicologo_id', psicologoId)
                  .eq('type', 'whatsapp_disconnect')
                  .gte('created_at', fiveMinutesAgo)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle()
                
                if (!recentNotif) {
                  shouldCreateNotification = true
                  console.log('⚠️ oldStatus não disponível, mas assumindo que estava connected (sem notificação recente)')
                } else {
                  console.log('ℹ️ Notificação de desconexão já existe (criada em:', recentNotif.created_at, '), não criando duplicata')
                }
              } catch (error) {
                console.error('Erro ao verificar notificação existente:', error)
                // Em caso de erro, criar notificação para garantir
                shouldCreateNotification = true
              }
            }
            
            // Criar notificação apenas se necessário
            if (shouldCreateNotification) {
              try {
                const instanceName = payload.new?.instance_name || payload.old?.instance_name
                if (instanceName) {
                  await whatsappService.createDisconnectNotification(psicologoId, instanceName)
                  console.log('✅ Notificação de desconexão criada via Realtime')
                } else {
                  console.error('❌ instance_name não encontrado no payload')
                }
              } catch (error) {
                console.error('❌ Erro ao criar notificação via Realtime:', error)
              }
            }
          }
          
          // Gerenciar monitoramento baseado no novo status
          if (newStatus === 'connected' || newStatus === 'connecting') {
            // Verificar se já está monitorando antes de iniciar
            if (!monitoringIntervals.has(psicologoId)) {
              console.log('✅ Iniciando monitoramento via Realtime para status:', newStatus)
              await startMonitoring(psicologoId)
            } else {
              console.log('ℹ️ Monitoramento já está ativo para este psicólogo')
            }
          } else if (newStatus === 'disconnected' || newStatus === 'error') {
            // Continuar monitorando por um tempo para detectar reconexão
            // Mas o checkInstanceStatus vai parar automaticamente se desconectado há mais de 1 hora
            console.log('ℹ️ Status mudou para disconnected/error, continuando monitoramento temporariamente')
          }
        }
        
        // Se foi criada uma instância, iniciar monitoramento se estiver connected ou connecting
        if (payload.eventType === 'INSERT') {
          const status = payload.new?.status
          console.log('📥 Nova instância criada:', { status, psicologoId })
          if (status === 'connected' || status === 'connecting') {
            console.log('✅ Iniciando monitoramento para nova instância:', status)
            await startMonitoring(psicologoId)
          }
        }
        
        // Se foi deletada, parar monitoramento
        if (payload.eventType === 'DELETE') {
          stopMonitoring(psicologoId)
        }
      }
    )
    .subscribe()

  realtimeChannel = channel

  return () => {
    console.log('🧹 Limpando Realtime monitoring...')
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
      isRealtimeSetup = false
    }
  }
}

