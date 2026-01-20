import { supabase } from '../lib/supabase'

export interface MarcarComparecimentoResult {
  prontuario: any | null
  error: Error | null
}

/**
 * Marca comparecimento de uma sessão agendada
 * Se compareceu = true, cria prontuário automaticamente
 * @param sessaoAgendadaId - ID da sessão agendada
 * @param compareceu - true = compareceu, false = não compareceu
 * @param anotacoes - Anotações opcionais da sessão
 */
export async function marcarComparecimento(
  sessaoAgendadaId: string,
  compareceu: boolean,
  anotacoes: string = ''
): Promise<MarcarComparecimentoResult> {
  try {
    // Buscar dados da sessão agendada
    const { data: sessaoAgendada, error: fetchError } = await supabase
      .from('sessoes_agendadas')
      .select('*')
      .eq('id', sessaoAgendadaId)
      .single()

    if (fetchError) throw fetchError
    if (!sessaoAgendada) throw new Error('Sessão agendada não encontrada')

    // Atualizar comparecimento na sessão agendada
    const { error: updateError } = await supabase
      .from('sessoes_agendadas')
      .update({
        compareceu: compareceu,
        anotacoes: anotacoes || sessaoAgendada.anotacoes || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessaoAgendadaId)

    if (updateError) throw updateError

    let prontuario = null

    // Se compareceu, criar prontuário
    if (compareceu === true) {
      // Buscar valor da sessão do paciente
      const { data: paciente } = await supabase
        .from('pacientes')
        .select('valor_sessao')
        .eq('id', sessaoAgendada.paciente_id)
        .single()

      const valorSessao = paciente?.valor_sessao || 0

      // Criar prontuário
      const { data: novoProntuario, error: prontuarioError } = await supabase
        .from('prontuarios')
        .insert([
          {
            paciente_id: sessaoAgendada.paciente_id,
            data: sessaoAgendada.data,
            hora: sessaoAgendada.hora,
            compareceu: true,
            anotacoes: anotacoes || sessaoAgendada.anotacoes || ''
          }
        ])
        .select()
        .single()

      if (prontuarioError) throw prontuarioError

      prontuario = novoProntuario

      // Verificar se há pagamento previsto vinculado à sessão agendada
      const { data: pagamentoPrevisto } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('sessao_agendada_id', sessaoAgendadaId)
        .single()

      if (pagamentoPrevisto) {
        // Atualizar pagamento previsto para vincular ao prontuário criado
        const { error: pagamentoUpdateError } = await supabase
          .from('pagamentos')
          .update({
            prontuario_id: novoProntuario.id,
            sessao_agendada_id: null, // Remover vínculo com sessão agendada
            compareceu: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', pagamentoPrevisto.id)

        if (pagamentoUpdateError) {
          console.error('Erro ao atualizar pagamento previsto:', pagamentoUpdateError)
          // Não falhar a operação se houver erro ao atualizar pagamento
        }
      } else {
        // Se não há pagamento previsto, criar pagamento normal
        const dataPagamento = new Date().toISOString().split('T')[0]
        const { error: pagamentoError } = await supabase
          .from('pagamentos')
          .insert([
            {
              prontuario_id: novoProntuario.id,
              paciente_id: sessaoAgendada.paciente_id,
              data: sessaoAgendada.data,
              data_vencimento: sessaoAgendada.data, // Por padrão, vence na data da consulta
              data_pagamento: dataPagamento,
              valor_sessao: valorSessao,
              desconto: 0,
              compareceu: true,
              pago: false
            }
          ])

        if (pagamentoError) {
          console.error('Erro ao criar pagamento:', pagamentoError)
          // Não falhar a operação se houver erro ao criar pagamento
        }
      }
    } else if (compareceu === false) {
      // Se não compareceu, apenas atualizar pagamento previsto se existir
      const { data: pagamentoPrevisto } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('sessao_agendada_id', sessaoAgendadaId)
        .single()

      if (pagamentoPrevisto) {
        const { error: pagamentoUpdateError } = await supabase
          .from('pagamentos')
          .update({
            compareceu: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', pagamentoPrevisto.id)

        if (pagamentoUpdateError) {
          console.error('Erro ao atualizar pagamento previsto:', pagamentoUpdateError)
        }
      }
    }

    return { prontuario, error: null }
  } catch (error) {
    console.error('Erro ao marcar comparecimento:', error)
    return { prontuario: null, error: error as Error }
  }
}
