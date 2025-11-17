import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider, useToast } from './contexts/ToastContext'
import { NotificationProvider } from './contexts/NotificationContext'
import ProtectedRoute from './components/ProtectedRoute'
import ThemeProvider from './components/ThemeProvider'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import PacienteDetalhes from './pages/PacienteDetalhes'
import Admin from './pages/Admin'
import Configuracoes from './pages/Configuracoes'
import ConfirmarSessao from './pages/ConfirmarSessao'
import Confirmacoes from './pages/Confirmacoes'
import * as whatsappMonitorService from './services/whatsappMonitorService'

// Componente interno para inicializar monitoramento quando autenticado
function AppContent() {
  const { user } = useAuth()
  const toast = useToast()
  // Usar ref para manter referência atualizada do toast
  const toastRef = useRef(toast)

  // Atualizar ref sempre que toast mudar
  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  useEffect(() => {
    if (!user?.id) {
      // Se não há usuário, parar todo monitoramento
      whatsappMonitorService.stopAllMonitoring()
      return
    }
    
    if (!toast) {
      return // Aguardar toast estar disponível
    }
    
    console.log('🚀 Inicializando monitoramento WhatsApp global para usuário:', user.id)
    
    // Registrar callback para mostrar toasts
    // Usar ref para acessar toast atualizado dentro do callback
    whatsappMonitorService.setToastCallback((message, type) => {
        console.log('🔔 Callback de toast chamado:', { message, type })
        
        // Obter toast atual da ref
        const currentToast = toastRef.current
        
        try {
          if (!currentToast) {
            console.warn('⚠️ Toast não disponível no callback')
            return
          }
          
          console.log('🔍 Verificando funções do toast:', {
            hasError: !!currentToast.error,
            hasSuccess: !!currentToast.success,
            hasInfo: !!currentToast.info,
            errorType: typeof currentToast.error,
            keys: Object.keys(currentToast)
          })
          
          if (type === 'error' && currentToast.error && typeof currentToast.error === 'function') {
            console.log('📢 Chamando toast.error:', message)
            currentToast.error(message)
          } else if (type === 'success' && currentToast.success && typeof currentToast.success === 'function') {
            currentToast.success(message)
          } else if (type === 'info' && currentToast.info && typeof currentToast.info === 'function') {
            currentToast.info(message)
          } else {
            console.warn('⚠️ Tipo de toast inválido ou função não disponível:', { 
              type, 
              hasError: !!currentToast?.error,
              hasSuccess: !!currentToast?.success,
              hasInfo: !!currentToast?.info,
              toastKeys: currentToast ? Object.keys(currentToast) : [],
              toastValue: currentToast
            })
          }
        } catch (error) {
          console.error('❌ Erro ao exibir toast:', error)
        }
      })
      
    console.log('✅ Callback de toast registrado')
    
    // Escutar evento customizado de desconexão (com proteção contra duplicatas)
    let lastDisconnectEventTime = 0
    const DISCONNECT_EVENT_COOLDOWN = 30000 // 30 segundos
    
    const handleDisconnect = (event) => {
      try {
        const now = Date.now()
        if (now - lastDisconnectEventTime < DISCONNECT_EVENT_COOLDOWN) {
          console.log('⏭️ Evento de desconexão ignorado (cooldown ativo)')
          return
        }
        
        const currentToast = toastRef.current
        if (event.detail && event.detail.message && currentToast?.error) {
          currentToast.error(event.detail.message)
          lastDisconnectEventTime = now
        }
      } catch (error) {
        console.error('Erro ao exibir toast de desconexão:', error)
      }
    }
    window.addEventListener('whatsapp-disconnected', handleDisconnect)
    
    // Inicializar monitoramento WhatsApp
    whatsappMonitorService.initializeMonitoring()
    
    // Configurar Realtime para monitorar mudanças
    const cleanup = whatsappMonitorService.setupRealtimeMonitoring()
    
    console.log('✅ Monitoramento WhatsApp global configurado')
    
    return () => {
      console.log('🛑 Parando monitoramento WhatsApp global')
      cleanup()
      whatsappMonitorService.stopAllMonitoring()
      window.removeEventListener('whatsapp-disconnected', handleDisconnect)
    }
  }, [user?.id, toast])

  return null
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
          <NotificationProvider>
            <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/confirmar-sessao/:sessaoId" element={<ConfirmarSessao />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pacientes"
              element={
                <ProtectedRoute>
                  <Pacientes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pacientes/:id"
              element={
                <ProtectedRoute>
                  <PacienteDetalhes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <Configuracoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/confirmacoes"
              element={
                <ProtectedRoute>
                  <Confirmacoes />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App



