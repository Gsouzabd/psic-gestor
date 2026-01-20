// Estetic Gestor theme configuration
export const theme = {
  systemType: 'esteticista' as const,
  appName: 'Estetic Gestor',
  colors: {
    primary: '#009c67',
    secondary: '#009c67',
    background: '#ffffff'
  }
}

export type SystemType = typeof theme.systemType
