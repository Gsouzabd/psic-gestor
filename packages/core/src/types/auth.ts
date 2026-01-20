import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  nome_completo: string
  role: 'admin_master' | 'psicologo' | 'esteticista'
  email?: string
  telefone?: string
  created_at?: string
  updated_at?: string
}

export interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  isPsicologo: boolean
  isEsteticista: boolean
  userType: string | null
  signUp: (email: string, password: string, nomeCompleto: string) => Promise<{ data: any; error: any }>
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
}
