import { useMemo } from 'react'

/**
 * Hook para detectar o domínio atual e determinar o tipo de sistema
 * @returns {Object} { systemType, isPsicGestor, isEsteticGestor, baseUrl }
 */
export function useDomainDetection() {
  const detection = useMemo(() => {
    const hostname = window.location.hostname
    const isPsicGestor = hostname.includes('psicgestor') || hostname === 'localhost'
    const isEsteticGestor = hostname.includes('esteticgestor')
    
    // Por padrão, se não for esteticgestor, assume psicgestor
    const systemType = isEsteticGestor ? 'esteticista' : 'psicologo'
    
    return {
      systemType,
      isPsicGestor,
      isEsteticGestor,
      baseUrl: window.location.origin
    }
  }, [])

  return detection
}

export default useDomainDetection

