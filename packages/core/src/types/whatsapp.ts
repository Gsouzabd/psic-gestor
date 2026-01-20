export interface WhatsAppInstance {
  id: string
  psicologo_id: string
  instance_name: string
  phone_number?: string
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  qr_code?: string
  qr_code_expires_at?: string
  error_message?: string
  last_status_check?: string
  webhook_url?: string
  created_at: string
  updated_at: string
}

export interface EvolutionAPIConnectionState {
  instance: string
  state: 'open' | 'close' | 'connecting'
  status?: string
}

export interface EvolutionAPIQRCode {
  code: string
  base64?: string
}

export interface CreateInstanceRequest {
  instanceName: string
  token?: string
  qrcode?: boolean
}

export interface SendMessageRequest {
  number: string
  text: string
}

export interface SetWebhookRequest {
  url: string
  webhook_by_events?: boolean
  webhook_base64?: boolean
  events?: string[]
}
