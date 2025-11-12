import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext({})

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info') => {
    console.log('🎯 showToast chamado:', { message, type })
    const id = Date.now() + Math.random()
    const newToast = { id, message, type }
    
    console.log('📝 Adicionando toast ao estado:', newToast)
    setToasts(prev => {
      const updated = [...prev, newToast]
      console.log('📊 Total de toasts agora:', updated.length)
      return updated
    })

    // Remover automaticamente após 5 segundos
    setTimeout(() => {
      console.log('⏰ Removendo toast após 5 segundos:', id)
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((message) => showToast(message, 'success'), [showToast])
  const error = useCallback((message) => showToast(message, 'error'), [showToast])
  const info = useCallback((message) => showToast(message, 'info'), [showToast])

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer = ({ toasts, onRemove }) => {
  console.log('🎨 ToastContainer renderizado com', toasts.length, 'toasts')
  
  if (toasts.length === 0) {
    return null
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      {toasts.map(toast => {
        console.log('🎯 Renderizando toast:', toast.id, toast.message)
        return <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      })}
    </div>
  )
}

const Toast = ({ toast, onRemove }) => {
  const { message, type } = toast

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: AlertCircle
  }

  const Icon = icons[type]

  return (
    <div
      className={`${styles[type]} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in-right`}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

