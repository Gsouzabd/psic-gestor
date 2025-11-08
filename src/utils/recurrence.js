import { addDays, format, parseISO, isBefore, isAfter } from 'date-fns'
import { supabase } from '../lib/supabase'

/**
 * Calcula todas as datas de uma recorrência até a data final
 * @param {string} dataInicio - Data inicial no formato YYYY-MM-DD
 * @param {string} tipoRecorrencia - 'semanal' ou 'quinzenal'
 * @param {string} dataFim - Data final no formato YYYY-MM-DD
 * @returns {string[]} Array de datas no formato YYYY-MM-DD
 */
export function calculateRecurrenceDates(dataInicio, tipoRecorrencia, dataFim) {
  const dates = []
  const startDate = parseISO(dataInicio)
  const endDate = parseISO(dataFim)
  
  if (isAfter(startDate, endDate)) {
    return dates
  }

  const intervalDays = tipoRecorrencia === 'semanal' ? 7 : 14
  let currentDate = startDate

  while (isBefore(currentDate, endDate) || format(currentDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
    dates.push(format(currentDate, 'yyyy-MM-dd'))
    currentDate = addDays(currentDate, intervalDays)
  }

  return dates
}

/**
 * Gera todos os agendamentos recorrentes e cria prontuários e pagamentos
 * @param {Object} params
 * @param {string} params.dataInicio - Data inicial no formato YYYY-MM-DD
 * @param {string} params.hora - Hora no formato HH:mm
 * @param {string} params.tipoRecorrencia - 'semanal' ou 'quinzenal'
 * @param {string} params.dataFim - Data final no formato YYYY-MM-DD
 * @param {string} params.pacienteId - ID do paciente
 * @param {string} params.recorrenciaId - ID da recorrência
 * @param {number} params.valorSessao - Valor da sessão
 * @param {boolean} params.criarPrevisao - Se true, cria pagamentos com previsao=true
 * @returns {Promise<{prontuarios: string[], errors: Error[]}>}
 */
export async function generateRecurringAppointments({
  dataInicio,
  hora,
  tipoRecorrencia,
  dataFim,
  pacienteId,
  recorrenciaId,
  valorSessao = 0,
  criarPrevisao = false
}) {
  const dates = calculateRecurrenceDates(dataInicio, tipoRecorrencia, dataFim)
  const prontuarioIds = []
  const errors = []

  for (let i = 0; i < dates.length; i++) {
    const data = dates[i]
    const isOriginal = i === 0

    try {
      // Criar prontuário
      const { data: prontuario, error: prontuarioError } = await supabase
        .from('prontuarios')
        .insert([
          {
            paciente_id: pacienteId,
            data: data,
            hora: hora,
            compareceu: null, // Agendado
            anotacoes: '',
            recorrencia_id: recorrenciaId,
            ocorrencia_original: isOriginal
          }
        ])
        .select()
        .single()

      if (prontuarioError) {
        errors.push(new Error(`Erro ao criar prontuário para ${data}: ${prontuarioError.message}`))
        continue
      }

      prontuarioIds.push(prontuario.id)

      // Criar pagamento vinculado apenas se criarPrevisao for true
      if (criarPrevisao) {
        const { error: pagamentoError } = await supabase
          .from('pagamentos')
          .insert([
            {
              prontuario_id: prontuario.id,
              paciente_id: pacienteId,
              data: data,
              valor_sessao: valorSessao,
              desconto: 0,
              compareceu: null, // Agendado
              pago: false,
              previsao: true // Pagamento previsto
            }
          ])

        if (pagamentoError) {
          errors.push(new Error(`Erro ao criar pagamento para ${data}: ${pagamentoError.message}`))
        }
      }
    } catch (error) {
      errors.push(new Error(`Erro inesperado ao criar agendamento para ${data}: ${error.message}`))
    }
  }

  return { prontuarios: prontuarioIds, errors }
}

/**
 * Deleta todos os agendamentos futuros de uma recorrência
 * @param {string} recorrenciaId - ID da recorrência
 * @param {string} dataLimite - Data limite (deleta apenas agendamentos a partir desta data, inclusive)
 * @returns {Promise<{deleted: number, errors: Error[]}>}
 */
export async function deleteFutureRecurringAppointments(recorrenciaId, dataLimite = null) {
  const errors = []
  let query = supabase
    .from('prontuarios')
    .select('id')
    .eq('recorrencia_id', recorrenciaId)

  if (dataLimite) {
    query = query.gte('data', dataLimite)
  }

  const { data: prontuarios, error: fetchError } = await query

  if (fetchError) {
    return { deleted: 0, errors: [fetchError] }
  }

  if (!prontuarios || prontuarios.length === 0) {
    return { deleted: 0, errors: [] }
  }

  const prontuarioIds = prontuarios.map(p => p.id)
  let deletedCount = 0

  // Deletar pagamentos primeiro (devido à foreign key)
  for (const prontuarioId of prontuarioIds) {
    const { error: pagamentoError } = await supabase
      .from('pagamentos')
      .delete()
      .eq('prontuario_id', prontuarioId)

    if (pagamentoError) {
      errors.push(pagamentoError)
    } else {
      deletedCount++
    }
  }

  // Deletar prontuários
  const { error: prontuarioError } = await supabase
    .from('prontuarios')
    .delete()
    .in('id', prontuarioIds)

  if (prontuarioError) {
    errors.push(prontuarioError)
  } else {
    // Contar quantos foram deletados (assumindo que todos foram deletados se não houve erro)
    deletedCount = prontuarioIds.length
  }

  return { deleted: deletedCount, errors }
}

