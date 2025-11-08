import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Calendar, Clock, DollarSign, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Função para criar Date a partir de string YYYY-MM-DD no fuso horário local
const parseLocalDate = (dateString) => {
  if (!dateString) return new Date()
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function SessoesAgendadasTab({ pacienteId, paciente }) {
  const [loading, setLoading] = useState(true)
  const [sessoesAgendadas, setSessoesAgendadas] = useState([])

  useEffect(() => {
    fetchSessoesAgendadas()
  }, [pacienteId])

  const fetchSessoesAgendadas = async () => {
    try {
      // Buscar apenas prontuários agendados (compareceu = null)
      const { data: prontuarios, error } = await supabase
        .from('prontuarios')
        .select('*, recorrencia_id')
        .eq('paciente_id', pacienteId)
        .is('compareceu', null)
        .order('data', { ascending: true })
        .order('hora', { ascending: true })

      if (error) throw error

      // Para cada prontuário, verificar se tem pagamento vinculado
      const sessoesComPagamento = await Promise.all(
        (prontuarios || []).map(async (prontuario) => {
          const { data: pagamento } = await supabase
            .from('pagamentos')
            .select('id, previsao')
            .eq('prontuario_id', prontuario.id)
            .single()

          return {
            ...prontuario,
            temPagamento: !!pagamento,
            pagamentoPrevisao: pagamento?.previsao || false
          }
        })
      )

      setSessoesAgendadas(sessoesComPagamento)
    } catch (error) {
      console.error('Erro ao buscar sessões agendadas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCriarPagamento = async (sessao) => {
    if (!confirm(`Deseja criar um pagamento para a sessão de ${format(parseLocalDate(sessao.data), "dd/MM/yyyy", { locale: ptBR })}?`)) {
      return
    }

    try {
      const valorSessao = paciente.valor_sessao || 0

      const { error } = await supabase
        .from('pagamentos')
        .insert([
          {
            prontuario_id: sessao.id,
            paciente_id: pacienteId,
            data: sessao.data,
            valor_sessao: valorSessao,
            desconto: 0,
            compareceu: null, // Agendado
            pago: false,
            previsao: false // Pagamento real, não previsto
          }
        ])

      if (error) throw error

      alert('Pagamento criado com sucesso!')
      fetchSessoesAgendadas()
    } catch (error) {
      console.error('Erro ao criar pagamento:', error)
      alert('Erro ao criar pagamento. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">Sessões Agendadas</h3>
        <p className="text-sm text-gray-600 mt-1">
          {sessoesAgendadas.length} {sessoesAgendadas.length === 1 ? 'sessão agendada' : 'sessões agendadas'}
        </p>
      </div>

      {sessoesAgendadas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Nenhuma sessão agendada</p>
          <p className="text-sm text-gray-500">As sessões agendadas aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessoesAgendadas.map((sessao) => (
            <div
              key={sessao.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-lg bg-yellow-50">
                    <Calendar className="w-6 h-6 text-yellow-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">
                          {format(parseLocalDate(sessao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{sessao.hora?.slice(0, 5) || 'Não informado'}</span>
                      </div>
                    </div>
                    
                    {sessao.recorrencia_id && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mb-2">
                        Recorrente
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {sessao.temPagamento ? (
                    <div className="flex flex-col items-end gap-2">
                      {sessao.pagamentoPrevisao ? (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          Pagamento previsto
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Pagamento criado
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCriarPagamento(sessao)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition text-sm font-medium"
                    >
                      <DollarSign className="w-4 h-4" />
                      Criar pagamento
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

