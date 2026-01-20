import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface Notification {
  id: string
  psicologo_id: string
  type: string
  message: string
  sessao_id: string | null
  read: boolean
  created_at: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: Notification) => void
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  // Buscar notificações do Supabase
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([])
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('psicologo_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications((data as Notification[]) || [])
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Buscar notificações ao montar e quando user mudar
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Escutar novas notificações em tempo real usando Supabase Realtime
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `psicologo_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Nova notificação recebida em tempo real:', payload)
          // Adicionar nova notificação ao estado
          if (payload.new) {
            console.log('Adicionando notificação ao estado:', payload.new)
            setNotifications(prev => {
              // Verificar se já existe para evitar duplicatas
              const exists = prev.some(n => n.id === (payload.new as Notification).id)
              if (exists) {
                console.log('Notificação já existe no estado, ignorando')
                return prev
              }
              return [payload.new as Notification, ...prev]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // Contar notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }, [])

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('psicologo_id', user.id)
        .eq('read', false)

      if (error) throw error

      // Atualizar estado local
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
    }
  }, [user?.id])

  // Adicionar notificação (para uso interno, geralmente vem do Supabase)
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev])
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        addNotification,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
