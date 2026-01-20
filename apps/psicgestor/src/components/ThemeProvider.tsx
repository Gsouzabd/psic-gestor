import { useEffect, ReactNode } from 'react'
import { theme } from '../config/theme'

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * Componente que aplica o tema (cores) para Psic Gestor
 */
export default function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement

    // Aplicar cores do Psic Gestor
    root.style.setProperty('--color-primary', theme.colors.primary)
    root.style.setProperty('--color-secondary', theme.colors.secondary)
    root.style.setProperty('--color-background', theme.colors.background)
  }, [])

  return <>{children}</>
}
