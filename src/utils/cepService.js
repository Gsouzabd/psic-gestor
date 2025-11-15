/**
 * Serviço para buscar dados de endereço via CEP usando a API ViaCEP
 * @param {string} cep - CEP no formato 00000-000 ou 00000000
 * @returns {Promise<Object>} Dados do endereço ou null se não encontrado
 */
export async function buscarCEP(cep) {
  // Remove caracteres não numéricos
  const cepLimpo = cep.replace(/\D/g, '')

  // Valida se tem 8 dígitos
  if (cepLimpo.length !== 8) {
    throw new Error('CEP deve conter 8 dígitos')
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const data = await response.json()

    // ViaCEP retorna erro quando CEP não é encontrado
    if (data.erro) {
      throw new Error('CEP não encontrado')
    }

    return {
      cep: data.cep,
      rua: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      estado: data.uf || ''
    }
  } catch (error) {
    if (error.message === 'CEP não encontrado' || error.message === 'CEP deve conter 8 dígitos') {
      throw error
    }
    throw new Error('Erro ao buscar CEP. Tente novamente.')
  }
}

/**
 * Formata CEP para o padrão 00000-000
 * @param {string} cep - CEP sem formatação
 * @returns {string} CEP formatado
 */
export function formatarCEP(cep) {
  const cepLimpo = cep.replace(/\D/g, '')
  if (cepLimpo.length <= 5) {
    return cepLimpo
  }
  return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5, 8)}`
}

