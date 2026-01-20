import { useMemo } from 'react'

export interface DomainDetection {
  systemType: 'psicologo' | 'esteticista'
  isPsicGestor: boolean
  isEsteticGestor: boolean
  baseUrl: string
}

/**
 * Hook para detectar o domínio atual e determinar o tipo de sistema
 * @returns {DomainDetection} { systemType, isPsicGestor, isEsteticGestor, baseUrl }
 */
export function useDomainDetection(): DomainDetection {
  const detection = useMemo(() => {
    const hostname = window.location.hostname
    const isPsicGestor = hostname.includes('psicgestor') || hostname === 'localhost'
    const isEsteticGestor = hostname.includes('esteticgestor')

    // Por padrão, se não for esteticgestor, assume psicgestor
    const systemType: DomainDetection['systemType'] = isEsteticGestor ? 'esteticista' : 'psicologo'

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
