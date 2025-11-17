import { useEffect } from 'react'
import { useDomainDetection } from '../hooks/useDomainDetection'

/**
 * Componente que aplica o tema (cores) baseado no domínio
 */
export default function ThemeProvider({ children }) {
  const { isEsteticGestor } = useDomainDetection()

  useEffect(() => {
    const root = document.documentElement

    if (isEsteticGestor) {
      // Cores do Estetic Gestor
      root.style.setProperty('--color-primary', '#009c67')
      root.style.setProperty('--color-secondary', '#5f5c44')
      root.style.setProperty('--color-background', '#f6f2e5')
    } else {
      // Cores do Psic Gestor
      root.style.setProperty('--color-primary', '#415347')
      root.style.setProperty('--color-secondary', '#5f5c44')
      root.style.setProperty('--color-background', '#f6f2e5')
    }
  }, [isEsteticGestor])

  return children
}

