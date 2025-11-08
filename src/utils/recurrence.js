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
 * Gera todos os agendamentos recorrentes e cria sessões agendadas e pagamentos
 * @param {Object} params
 * @param {string} params.dataInicio - Data inicial no formato YYYY-MM-DD
 * @param {string} params.hora - Hora no formato HH:mm
 * @param {string} params.tipoRecorrencia - 'semanal' ou 'quinzenal'
 * @param {string} params.dataFim - Data final no formato YYYY-MM-DD
 * @param {string} params.pacienteId - ID do paciente
 * @param {string} params.recorrenciaId - ID da recorrência
 * @param {number} params.valorSessao - Valor da sessão
 * @param {boolean} params.criarPrevisao - Se true, cria pagamentos com previsao=true
 * @returns {Promise<{sessoesAgendadas: string[], errors: Error[]}>}
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
  const sessoesAgendadasIds = []
  const errors = []

  for (let i = 0; i < dates.length; i++) {
    const data = dates[i]

    try {
      // Criar sessão agendada
      const { data: sessaoAgendada, error: sessaoError } = await supabase
        .from('sessoes_agendadas')
        .insert([
          {
            paciente_id: pacienteId,
            data: data,
            hora: hora,
            compareceu: null, // Ainda não foi marcado
            anotacoes: '',
            recorrencia_id: recorrenciaId
          }
        ])
        .select()
        .single()

      if (sessaoError) {
        errors.push(new Error(`Erro ao criar sessão agendada para ${data}: ${sessaoError.message}`))
        continue
      }

      sessoesAgendadasIds.push(sessaoAgendada.id)

      // Criar pagamento previsto vinculado apenas se criarPrevisao for true
      if (criarPrevisao) {
        const { error: pagamentoError } = await supabase
          .from('pagamentos')
          .insert([
            {
              sessao_agendada_id: sessaoAgendada.id,
              paciente_id: pacienteId,
              data: data,
              valor_sessao: valorSessao,
              desconto: 0,
              compareceu: null, // Ainda não foi marcado
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

  return { sessoesAgendadas: sessoesAgendadasIds, errors }
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
    .from('sessoes_agendadas')
    .select('id')
    .eq('recorrencia_id', recorrenciaId)

  if (dataLimite) {
    query = query.gte('data', dataLimite)
  }

  const { data: sessoesAgendadas, error: fetchError } = await query

  if (fetchError) {
    return { deleted: 0, errors: [fetchError] }
  }

  if (!sessoesAgendadas || sessoesAgendadas.length === 0) {
    return { deleted: 0, errors: [] }
  }

  const sessoesAgendadasIds = sessoesAgendadas.map(s => s.id)
  let deletedCount = 0

  if (sessoesAgendadasIds.length === 0) {
    return { deleted: 0, errors: [] }
  }

  // Deletar pagamentos primeiro (devido à foreign key)
  // Usar delete em lote para melhor performance
  const { error: pagamentoError } = await supabase
    .from('pagamentos')
    .delete()
    .in('sessao_agendada_id', sessoesAgendadasIds)

  if (pagamentoError) {
    errors.push(pagamentoError)
    // Tentar deletar individualmente se o delete em lote falhar
    for (const sessaoId of sessoesAgendadasIds) {
      const { error: individualError } = await supabase
        .from('pagamentos')
        .delete()
        .eq('sessao_agendada_id', sessaoId)
      
      if (individualError) {
        errors.push(individualError)
      }
    }
  }

  // Deletar sessões agendadas
  const { error: sessaoError } = await supabase
    .from('sessoes_agendadas')
    .delete()
    .in('id', sessoesAgendadasIds)

  if (sessaoError) {
    errors.push(sessaoError)
    // Tentar deletar individualmente se o delete em lote falhar
    for (const sessaoId of sessoesAgendadasIds) {
      const { error: individualError } = await supabase
        .from('sessoes_agendadas')
        .delete()
        .eq('id', sessaoId)
      
      if (individualError) {
        errors.push(individualError)
      } else {
        deletedCount++
      }
    }
  } else {
    // Se não houve erro, todos foram deletados
    deletedCount = sessoesAgendadasIds.length
  }

  return { deleted: deletedCount, errors }
}

