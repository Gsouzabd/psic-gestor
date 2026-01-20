// Lib
export { supabase } from './lib/supabase'

// Types
export type { WhatsAppInstance, EvolutionAPIConnectionState, EvolutionAPIQRCode, CreateInstanceRequest, SendMessageRequest, SetWebhookRequest } from './types/whatsapp'
export type { Profile, AuthContextType } from './types/auth'

// Contexts
export { AuthProvider, useAuth } from './contexts/AuthContext'
export { ToastProvider, useToast } from './contexts/ToastContext'
export { NotificationProvider, useNotifications } from './contexts/NotificationContext'

// Hooks
export { useDomainDetection } from './hooks/useDomainDetection'
export type { DomainDetection } from './hooks/useDomainDetection'

// Utils
export { buscarCEP, formatarCEP } from './utils/cepService'
export type { CepResult } from './utils/cepService'
export { calculateRecurrenceDates, generateRecurringAppointments, deleteFutureRecurringAppointments } from './utils/recurrence'
export type { RecurrenceType, GenerateRecurringAppointmentsParams, GenerateRecurringAppointmentsResult, DeleteFutureRecurringAppointmentsResult } from './utils/recurrence'
export { marcarComparecimento } from './utils/sessoesAgendadas'
export type { MarcarComparecimentoResult } from './utils/sessoesAgendadas'

// Services
export { notifyPatient } from './services/notificationService'
export * as whatsappService from './services/whatsappService'
export * as whatsappMonitorService from './services/whatsappMonitorService'

// Components
export { default as Modal } from './components/Modal'
export { default as ProtectedRoute } from './components/ProtectedRoute'
export { default as Calendar } from './components/Calendar'
export type { Session } from './components/Calendar'
export { default as SessionCard } from './components/SessionCard'
export type { SessionData } from './components/SessionCard'
export { default as PatientCard } from './components/PatientCard'
export type { Patient } from './components/PatientCard'
export { default as FileUpload } from './components/FileUpload'
export { default as ImageUpload } from './components/ImageUpload'
export { default as NotificationBadge } from './components/NotificationBadge'
export { default as RecurrenceOptions } from './components/RecurrenceOptions'
export { default as RecurrenceActionModal } from './components/RecurrenceActionModal'
