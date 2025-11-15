import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Calendar, Clock, DollarSign, CheckCircle, XCircle, Trash2, MessageSquare, Video, MapPin, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { marcarComparecimento } from '../utils/sessoesAgendadas'
import { deleteFutureRecurringAppointments } from '../utils/recurrence'
import RecurrenceActionModal from './RecurrenceActionModal'
import { notifyPatient } from '../services/notificationService'
import { useToast } from '../contexts/ToastContext'

// Função para criar Date a partir de string YYYY-MM-DD no fuso horário local
const parseLocalDate = (dateString) => {
  if (!dateString) return new Date()
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function SessoesAgendadasTab({ pacienteId, paciente }) {
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [sessoesAgendadas, setSessoesAgendadas] = useState([])
  const [sessoesFiltradas, setSessoesFiltradas] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('todas') // todas, agendadas, confirmadas, canceladas
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false)
  const [pendingSessao, setPendingSessao] = useState(null)
  const [notifyingSessaoId, setNotifyingSessaoId] = useState(null)

  useEffect(() => {
    fetchSessoesAgendadas()
  }, [pacienteId])

  useEffect(() => {
    aplicarFiltro(sessoesAgendadas, filtroStatus)
  }, [filtroStatus, sessoesAgendadas])

  const aplicarFiltro = (sessoes, filtro) => {
    let filtradas = sessoes
    switch (filtro) {
      case 'agendadas':
        filtradas = sessoes.filter(s => s.compareceu === null)
        break
      case 'confirmadas':
        filtradas = sessoes.filter(s => s.compareceu === true)
        break
      case 'canceladas':
        filtradas = sessoes.filter(s => s.compareceu === false)
        break
      default:
        filtradas = sessoes
    }
    setSessoesFiltradas(filtradas)
  }

  const contarPorStatus = () => {
    return {
      todas: sessoesAgendadas.length,
      agendadas: sessoesAgendadas.filter(s => s.compareceu === null).length,
      confirmadas: sessoesAgendadas.filter(s => s.compareceu === true).length,
      canceladas: sessoesAgendadas.filter(s => s.compareceu === false).length
    }
  }

  const fetchSessoesAgendadas = async () => {
    try {
      // Buscar sessões agendadas (compareceu pode ser null, true ou false)
      const { data: sessoes, error } = await supabase
        .from('sessoes_agendadas')
        .select('*, recorrencia_id')
        .eq('paciente_id', pacienteId)
        .order('data', { ascending: true })
        .order('hora', { ascending: true })

      if (error) throw error

      // Para cada sessão, verificar se tem pagamento vinculado
      const sessoesComPagamento = await Promise.all(
        (sessoes || []).map(async (sessao) => {
          // Se compareceu = true, verificar se há pagamento vinculado ao prontuário criado
          if (sessao.compareceu === true) {
            // Buscar prontuário criado a partir desta sessão agendada
            const { data: prontuario } = await supabase
              .from('prontuarios')
              .select('id')
              .eq('paciente_id', sessao.paciente_id)
              .eq('data', sessao.data)
              .eq('hora', sessao.hora)
              .eq('compareceu', true)
              .single()

            if (prontuario) {
              // Verificar se há pagamento vinculado ao prontuário
              const { data: pagamento } = await supabase
                .from('pagamentos')
                .select('id, previsao')
                .eq('prontuario_id', prontuario.id)
                .single()

              return {
                ...sessao,
                temPagamento: !!pagamento,
                pagamentoPrevisao: pagamento?.previsao || false
              }
            }
          }

          // Para sessões não comparecidas ou ainda não marcadas, verificar pagamento previsto
          const { data: pagamento } = await supabase
            .from('pagamentos')
            .select('id, previsao')
            .eq('sessao_agendada_id', sessao.id)
            .single()

          return {
            ...sessao,
            temPagamento: !!pagamento,
            pagamentoPrevisao: pagamento?.previsao || false
          }
        })
      )

      setSessoesAgendadas(sessoesComPagamento)
      aplicarFiltro(sessoesComPagamento, filtroStatus)
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
            sessao_agendada_id: sessao.id,
            paciente_id: pacienteId,
            data: sessao.data,
            valor_sessao: valorSessao,
            desconto: 0,
            compareceu: null, // Ainda não foi marcado
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

  const handleMarcarComparecimento = async (sessao, compareceu) => {
    try {
      const { prontuario, error } = await marcarComparecimento(sessao.id, compareceu)

      if (error) {
        alert('Erro ao marcar comparecimento. Tente novamente.')
        return
      }

      if (compareceu && prontuario) {
        alert('Comparecimento marcado! Prontuário criado automaticamente.')
      } else {
        alert('Comparecimento marcado com sucesso!')
      }

      fetchSessoesAgendadas()
    } catch (error) {
      console.error('Erro ao marcar comparecimento:', error)
      alert('Erro ao marcar comparecimento. Tente novamente.')
    }
  }

  const contadores = contarPorStatus()

  const handleDeleteClick = (sessao) => {
    // Se a sessão faz parte de uma recorrência, mostrar modal de escolha
    if (sessao.recorrencia_id) {
      setPendingSessao(sessao)
      setShowRecurrenceModal(true)
    } else {
      // Se não é recorrente, deletar diretamente
      handleDeleteSessao(sessao.id, false)
    }
  }

  const handleDeleteRecurrence = async (deleteAllSeries) => {
    if (!pendingSessao) return

    const sessaoId = pendingSessao.id
    const recorrenciaId = pendingSessao.recorrencia_id

    if (deleteAllSeries) {
      // Deletar toda a série
      const { deleted, errors } = await deleteFutureRecurringAppointments(recorrenciaId, null)
      
      if (errors.length > 0) {
        alert('Erro ao excluir sessões. Tente novamente.')
        console.error('Erros ao deletar:', errors)
      } else {
        alert(`${deleted} sessão(ões) excluída(s) com sucesso!`)
      }
    } else {
      // Deletar apenas esta ocorrência
      await handleDeleteSessao(sessaoId, true)
    }

    setShowRecurrenceModal(false)
    setPendingSessao(null)
    fetchSessoesAgendadas()
  }

  const handleDeleteSessao = async (sessaoId, isRecurring = false) => {
    if (!confirm('Tem certeza que deseja excluir esta sessão agendada?')) {
      return
    }

    try {
      // Se é recorrente e estamos deletando apenas uma ocorrência, remover o vínculo com a recorrência
      if (isRecurring) {
        const { error: updateError } = await supabase
          .from('sessoes_agendadas')
          .update({ recorrencia_id: null })
          .eq('id', sessaoId)

        if (updateError) throw updateError
      }

      // Deletar pagamentos vinculados primeiro
      const { error: pagamentoError } = await supabase
        .from('pagamentos')
        .delete()
        .eq('sessao_agendada_id', sessaoId)

      if (pagamentoError) throw pagamentoError

      // Deletar sessão agendada
      const { error: sessaoError } = await supabase
        .from('sessoes_agendadas')
        .delete()
        .eq('id', sessaoId)

      if (sessaoError) throw sessaoError

      alert('Sessão excluída com sucesso!')
      fetchSessoesAgendadas()
    } catch (error) {
      console.error('Erro ao deletar sessão:', error)
      alert('Erro ao deletar sessão. Tente novamente.')
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

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltroStatus('todas')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filtroStatus === 'todas'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas ({contadores.todas})
        </button>
        <button
          onClick={() => setFiltroStatus('agendadas')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filtroStatus === 'agendadas'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Agendadas ({contadores.agendadas})
        </button>
        <button
          onClick={() => setFiltroStatus('confirmadas')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filtroStatus === 'confirmadas'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Confirmadas ({contadores.confirmadas})
        </button>
        <button
          onClick={() => setFiltroStatus('canceladas')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filtroStatus === 'canceladas'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Canceladas ({contadores.canceladas})
        </button>
      </div>

      {sessoesFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Nenhuma sessão agendada</p>
          <p className="text-sm text-gray-500">As sessões agendadas aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessoesFiltradas.map((sessao) => (
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
                    <div className="flex items-center gap-4 mb-2 flex-wrap">
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
                      {sessao.tipo_consulta && (
                        <div className="flex items-center gap-1 text-sm">
                          {sessao.tipo_consulta === 'online' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              <Video className="w-3 h-3" />
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                              <MapPin className="w-3 h-3" />
                              Presencial
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {sessao.tipo_consulta === 'online' && sessao.link_meet && (
                      <div className="mb-2">
                        <a
                          href={sessao.link_meet}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition text-sm font-medium"
                        >
                          <Video className="w-4 h-4" />
                          <span>Abrir Google Meet</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    
                    {sessao.recorrencia_id && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mb-2">
                        Recorrente
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {/* Status de comparecimento */}
                  {sessao.compareceu === true ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Compareceu
                    </span>
                  ) : sessao.compareceu === false ? (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Não Compareceu
                    </span>
                  ) : sessao.confirmada_pelo_paciente === true ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Confirmada pelo paciente
                      </span>
                      {sessao.confirmada_em && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(sessao.confirmada_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarcarComparecimento(sessao, true)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Compareceu
                        </button>
                        <button
                          onClick={() => handleMarcarComparecimento(sessao, false)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          Não Compareceu
                        </button>
                      </div>
                      {/* Botão NOTIFICAR PACIENTE */}
                      <button
                        onClick={async () => {
                          try {
                            setNotifyingSessaoId(sessao.id)
                            await notifyPatient(sessao.id)
                            success('Notificação enviada com sucesso! O paciente receberá uma mensagem no WhatsApp.')
                          } catch (error) {
                            const message = error?.message || 'Erro ao enviar notificação. Tente novamente.'
                            showError(message)
                          } finally {
                            setNotifyingSessaoId(null)
                          }
                        }}
                        disabled={notifyingSessaoId === sessao.id}
                        className="flex items-center justify-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {notifyingSessaoId === sessao.id ? 'Enviando...' : 'NOTIFICAR PACIENTE'}
                      </button>
                    </div>
                  )}

                  {/* Status de pagamento */}
                  {/* Se compareceu = true, não mostrar botão criar pagamento (já foi criado automaticamente) */}
                  {sessao.compareceu === true ? (
                    sessao.temPagamento ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Pagamento criado
                      </span>
                    ) : null
                  ) : sessao.temPagamento ? (
                    sessao.pagamentoPrevisao ? (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        Pagamento previsto
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Pagamento criado
                      </span>
                    )
                  ) : (
                    <button
                      onClick={() => handleCriarPagamento(sessao)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition text-sm font-medium"
                    >
                      <DollarSign className="w-4 h-4" />
                      Criar pagamento
                    </button>
                  )}

                  {/* Botão de excluir */}
                  <button
                    onClick={() => handleDeleteClick(sessao)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                    title="Excluir sessão"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de ação de recorrência */}
      <RecurrenceActionModal
        isOpen={showRecurrenceModal}
        onClose={() => {
          setShowRecurrenceModal(false)
          setPendingSessao(null)
        }}
        onConfirm={handleDeleteRecurrence}
        action="delete"
      />
    </div>
  )
}

