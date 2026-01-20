import { addDays, format, parseISO, isBefore, isAfter } from 'date-fns'
import { supabase } from '../lib/supabase'

export type RecurrenceType = 'semanal' | 'quinzenal'

export interface GenerateRecurringAppointmentsParams {
  dataInicio: string
  hora: string
  tipoRecorrencia: RecurrenceType
  dataFim: string
  pacienteId: string
  recorrenciaId: string
  valorSessao?: number
  criarPrevisao?: boolean
  tipoConsulta?: 'presencial' | 'online'
  linkMeet?: string | null
}

export interface GenerateRecurringAppointmentsResult {
  sessoesAgendadas: string[]
  errors: Error[]
}

export interface DeleteFutureRecurringAppointmentsResult {
  deleted: number
  errors: Error[]
}

/**
 * Calcula todas as datas de uma recorrência até a data final
 * @param dataInicio - Data inicial no formato YYYY-MM-DD
 * @param tipoRecorrencia - 'semanal' ou 'quinzenal'
 * @param dataFim - Data final no formato YYYY-MM-DD
 * @returns Array de datas no formato YYYY-MM-DD
 */
export function calculateRecurrenceDates(dataInicio: string, tipoRecorrencia: RecurrenceType, dataFim: string): string[] {
  const dates: string[] = []
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
 */
export async function generateRecurringAppointments({
  dataInicio,
  hora,
  tipoRecorrencia,
  dataFim,
  pacienteId,
  recorrenciaId,
  valorSessao = 0,
  criarPrevisao = false,
  tipoConsulta = 'presencial',
  linkMeet = null
}: GenerateRecurringAppointmentsParams): Promise<GenerateRecurringAppointmentsResult> {
  const dates = calculateRecurrenceDates(dataInicio, tipoRecorrencia, dataFim)
  const sessoesAgendadasIds: string[] = []
  const errors: Error[] = []

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
            recorrencia_id: recorrenciaId,
            tipo_consulta: tipoConsulta,
            link_meet: linkMeet
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
      errors.push(new Error(`Erro inesperado ao criar agendamento para ${data}: ${(error as Error).message}`))
    }
  }

  return { sessoesAgendadas: sessoesAgendadasIds, errors }
}

/**
 * Deleta todos os agendamentos futuros de uma recorrência
 * @param recorrenciaId - ID da recorrência
 * @param dataLimite - Data limite (deleta apenas agendamentos a partir desta data, inclusive)
 */
export async function deleteFutureRecurringAppointments(
  recorrenciaId: string,
  dataLimite: string | null = null
): Promise<DeleteFutureRecurringAppointmentsResult> {
  const errors: Error[] = []
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
