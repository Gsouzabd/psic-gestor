import { useState, useEffect, useRef } from 'react'
import { useNotifications } from '../contexts/NotificationContext'
import { supabase } from '../lib/supabase'
import { Bell, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

export default function NotificationBadge() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Polling de notificações a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refreshNotifications()
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [refreshNotifications])

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification.id)
    setIsOpen(false)
    
    // Navegar para a página do paciente relacionado à sessão
    if (notification.sessao_id) {
      // Buscar paciente_id da sessão
      try {
        const { data: sessao } = await supabase
          .from('sessoes_agendadas')
          .select('paciente_id')
          .eq('id', notification.sessao_id)
          .single()

        if (sessao?.paciente_id) {
          navigate(`/pacientes/${sessao.paciente_id}?tab=sessoes`)
        }
      } catch (error) {
        console.error('Erro ao buscar sessão:', error)
      }
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'confirmacao':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'cancelamento':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Calendar className="w-4 h-4 text-blue-600" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'confirmacao':
        return 'bg-green-50 border-green-200'
      case 'cancelamento':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        title="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary hover:text-primary-dark transition"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista de Notificações */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg border ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(notification.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

