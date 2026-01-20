// Psic Gestor theme configuration
export const theme = {
  systemType: 'psicologo' as const,
  appName: 'Psic Gestor',
  colors: {
    primary: '#415347',
    secondary: '#5f5c44',
    background: '#f6f2e5'
  }
}

export type SystemType = typeof theme.systemType
