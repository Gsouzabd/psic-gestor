import { useState, useEffect, useMemo } from 'react'
import { supabase, marcarComparecimento } from '@gestor/core'
import { DollarSign, CheckCircle, XCircle, Filter, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Função para criar Date a partir de string YYYY-MM-DD no fuso horário local
const parseLocalDate = (dateString: string | null) => {
  if (!dateString) return new Date()
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

interface PagamentosTabProps {
  pacienteId: string
  paciente: any
}

export default function PagamentosTab({ pacienteId, paciente }: PagamentosTabProps) {
  const [loading, setLoading] = useState(true)
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [filtro, setFiltro] = useState<'todos' | 'pagos' | 'pendentes'>('todos')
  const [mesesExpandidos, setMesesExpandidos] = useState<Set<string>>(new Set())
  const [resumo, setResumo] = useState({
    totalSessoes: 0,
    totalReceber: 0,
    totalRecebido: 0,
    saldoAberto: 0,
    valorPrevisto: 0
  })

  useEffect(() => {
    fetchPagamentos()
  }, [pacienteId])

  useEffect(() => {
    calcularResumo()
  }, [pagamentos])

  const fetchPagamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('data', { ascending: false })

      if (error) throw error
      setPagamentos(data || [])
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularResumo = () => {
    // Separar pagamentos previstos dos reais
    const pagamentosPrevistos = pagamentos.filter((p: any) => p.previsao)
    const pagamentosReais = pagamentos.filter((p: any) => !p.previsao)
    
    // Pagamentos previstos que ainda não foram pagos (excluir os que foram marcados como pagos)
    const pagamentosPrevistosNaoPagos = pagamentosPrevistos.filter((p: any) => !p.pago)
    
    const totalSessoes = pagamentosReais.length
    const totalReceber = pagamentosReais.reduce((sum: number, p: any) => sum + parseFloat(p.valor_final || 0), 0)
    const totalRecebido = pagamentosReais
      .filter((p: any) => p.pago)
      .reduce((sum: number, p: any) => sum + parseFloat(p.valor_final || 0), 0)
    const saldoAberto = totalReceber - totalRecebido
    // Valor previsto apenas dos pagamentos previstos que ainda não foram pagos
    const valorPrevisto = pagamentosPrevistosNaoPagos.reduce((sum: number, p: any) => sum + parseFloat(p.valor_final || 0), 0)

    setResumo({
      totalSessoes,
      totalReceber,
      totalRecebido,
      saldoAberto,
      valorPrevisto
    })
  }

  const handleTogglePago = async (pagamentoId: string, pagoAtual: boolean) => {
    try {
      const { error } = await supabase
        .from('pagamentos')
        .update({ pago: !pagoAtual })
        .eq('id', pagamentoId)

      if (error) throw error
      fetchPagamentos()
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error)
      alert('Erro ao atualizar pagamento')
    }
  }

  const handleMarcarComparecimentoPagamento = async (pagamento: any, compareceu: boolean) => {
    try {
      // Se o pagamento tem sessao_agendada_id, usar a função marcarComparecimento
      if (pagamento.sessao_agendada_id) {
        const { prontuario, error } = await marcarComparecimento(pagamento.sessao_agendada_id, compareceu)
        if (error) {
          alert('Erro ao marcar comparecimento. Tente novamente.')
          return
        }
        if (compareceu && prontuario) {
          // Prontuário foi criado automaticamente
        }
      } else {
        // Se não tem sessao_agendada_id, apenas atualizar o pagamento
        const { error } = await supabase
          .from('pagamentos')
          .update({ compareceu: compareceu })
          .eq('id', pagamento.id)

        if (error) throw error
      }

      fetchPagamentos()
    } catch (error) {
      console.error('Erro ao marcar comparecimento:', error)
      alert('Erro ao marcar comparecimento. Tente novamente.')
    }
  }

  const pagamentosFiltrados = pagamentos.filter((p: any) => {
    // Incluir todos os pagamentos (previstos e reais)
    if (filtro === 'pagos') return p.pago
    if (filtro === 'pendentes') return !p.pago
    return true
  })

  // Agrupar pagamentos por mês
  const pagamentosPorMes = useMemo(() => {
    const agrupados: Record<string, any> = {}
    
    pagamentosFiltrados.forEach((pagamento: any) => {
      if (!pagamento.data) return
      
      const date = parseLocalDate(pagamento.data)
      const mesAno = format(date, 'yyyy-MM')
      const mesAnoLabel = format(date, 'MMMM yyyy', { locale: ptBR })
      
      if (!agrupados[mesAno]) {
        agrupados[mesAno] = {
          label: mesAnoLabel,
          pagamentos: [],
          totalSessoes: 0,
          totalReceber: 0,
          totalRecebido: 0,
          saldoAberto: 0
        }
      }
      
      agrupados[mesAno].pagamentos.push(pagamento)
      agrupados[mesAno].totalSessoes++
      agrupados[mesAno].totalReceber += parseFloat(pagamento.valor_final || 0)
      
      if (pagamento.pago) {
        agrupados[mesAno].totalRecebido += parseFloat(pagamento.valor_final || 0)
      }
    })
    
    // Calcular saldo em aberto para cada mês
    Object.keys(agrupados).forEach(mes => {
      agrupados[mes].saldoAberto = agrupados[mes].totalReceber - agrupados[mes].totalRecebido
    })
    
    // Ordenar por data (mais recente primeiro)
    return Object.keys(agrupados)
      .sort((a, b) => b.localeCompare(a))
      .map(mes => ({ mes, ...agrupados[mes] }))
  }, [pagamentosFiltrados])

  // Expandir mês atual automaticamente
  useEffect(() => {
    if (pagamentosPorMes.length > 0 && mesesExpandidos.size === 0) {
      const hoje = new Date()
      const mesAtual = format(hoje, 'yyyy-MM')
      const mesAtualExiste = pagamentosPorMes.find(p => p.mes === mesAtual)
      
      if (mesAtualExiste) {
        setMesesExpandidos(new Set([mesAtual]))
      } else if (pagamentosPorMes.length > 0) {
        // Se não houver mês atual, expandir o primeiro (mais recente)
        setMesesExpandidos(new Set([pagamentosPorMes[0].mes]))
      }
    }
  }, [pagamentosPorMes])

  const toggleMes = (mes: string) => {
    setMesesExpandidos(prev => {
      const novo = new Set(prev)
      if (novo.has(mes)) {
        novo.delete(mes)
      } else {
        novo.add(mes)
      }
      return novo
    })
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
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border border-blue-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg flex-shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-blue-800 font-medium">Total de Sessões</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">{resumo.totalSessoes}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 sm:p-4 border border-purple-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-purple-600 rounded-lg flex-shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-purple-800 font-medium">Total a Receber</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900">R$ {resumo.totalReceber.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4 border border-green-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-green-600 rounded-lg flex-shrink-0">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-green-800 font-medium">Total Recebido</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">R$ {resumo.totalRecebido.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 sm:p-4 border border-yellow-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-yellow-600 rounded-lg flex-shrink-0">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-yellow-800 font-medium">Saldo em Aberto</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-900">R$ {resumo.saldoAberto.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-3 sm:p-4 border border-indigo-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-indigo-600 rounded-lg flex-shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-indigo-800 font-medium">Valor Previsto</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-900">R$ {resumo.valorPrevisto.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
          <span className="text-sm sm:text-base font-medium text-gray-700">Filtrar:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-xs sm:text-sm ${
              filtro === 'todos'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltro('pagos')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-xs sm:text-sm ${
              filtro === 'pagos'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pagos
          </button>
          <button
            onClick={() => setFiltro('pendentes')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition text-xs sm:text-sm ${
              filtro === 'pendentes'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pendentes
          </button>
        </div>
      </div>

      {/* Pagamentos por Mês */}
      {pagamentosFiltrados.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 sm:p-12 text-center border-2 border-dashed border-gray-300">
          <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 mb-3" />
          <p className="text-sm sm:text-base text-gray-600">
            {filtro === 'todos' 
              ? 'Nenhum pagamento registrado ainda' 
              : `Nenhum pagamento ${filtro === 'pagos' ? 'pago' : 'pendente'}`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pagamentosPorMes.map(({ mes, label, pagamentos: pagamentosMes, totalSessoes, totalReceber, totalRecebido, saldoAberto }) => {
            const isExpanded = mesesExpandidos.has(mes)
            
            return (
              <div key={mes} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header do Mês */}
                <button
                  onClick={() => toggleMes(mes)}
                  className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex-1 text-left">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 capitalize">{label}</h3>
                    <div className="flex flex-wrap gap-4 sm:gap-6 mt-2 text-xs sm:text-sm">
                      <span className="text-gray-600">
                        <span className="font-medium text-gray-900">{totalSessoes}</span> sessões
                      </span>
                      <span className="text-gray-600">
                        A receber: <span className="font-medium text-gray-900">R$ {totalReceber.toFixed(2)}</span>
                      </span>
                      <span className="text-gray-600">
                        Recebido: <span className="font-medium text-green-700">R$ {totalRecebido.toFixed(2)}</span>
                      </span>
                      <span className="text-gray-600">
                        Em aberto: <span className="font-medium text-yellow-700">R$ {saldoAberto.toFixed(2)}</span>
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Tabela do Mês */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                            <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Comp.</th>
                            <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase">Valor</th>
                            <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase">Desc.</th>
                            <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                            <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {pagamentosMes.map((pagamento: any) => (
                            <tr key={pagamento.id} className="hover:bg-gray-50 transition">
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                                <span className="text-xs sm:text-sm text-gray-900">
                                  {format(parseLocalDate(pagamento.data), "dd/MM/yy", { locale: ptBR })}
                                </span>
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                                {pagamento.compareceu === true ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : pagamento.compareceu === false ? (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                ) : (
                                  // Se compareceu é NULL (agendado), mostrar botões para marcar
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleMarcarComparecimentoPagamento(pagamento, true)}
                                      className="p-1 hover:bg-green-50 rounded transition"
                                      title="Marcar como compareceu"
                                    >
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    </button>
                                    <button
                                      onClick={() => handleMarcarComparecimentoPagamento(pagamento, false)}
                                      className="p-1 hover:bg-red-50 rounded transition"
                                      title="Marcar como não compareceu"
                                    >
                                      <XCircle className="w-4 h-4 text-red-600" />
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                <span className="text-xs sm:text-sm text-gray-900">
                                  R$ {parseFloat(pagamento.valor_sessao || 0).toFixed(2)}
                                </span>
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                <span className="text-xs sm:text-sm text-gray-600">
                                  {parseFloat(pagamento.desconto || 0) > 0 ? `-R$ ${parseFloat(pagamento.desconto || 0).toFixed(2)}` : '-'}
                                </span>
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                  R$ {parseFloat(pagamento.valor_final || 0).toFixed(2)}
                                </span>
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {pagamento.previsao && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                      <span className="hidden sm:inline">Pagamento previsto</span>
                                      <span className="sm:hidden">Previsto</span>
                                    </span>
                                  )}
                                  {pagamento.pago ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                      <CheckCircle className="w-3 h-3" />
                                      <span className="hidden sm:inline">Pago</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                      <XCircle className="w-3 h-3" />
                                      <span className="hidden sm:inline">Pend.</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                                <button
                                  onClick={() => handleTogglePago(pagamento.id, pagamento.pago)}
                                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                                    pagamento.pago
                                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      : 'bg-primary text-white hover:bg-opacity-90'
                                  }`}
                                >
                                  <span className="hidden md:inline">{pagamento.pago ? 'Marcar Pendente' : 'Marcar como Pago'}</span>
                                  <span className="md:hidden">{pagamento.pago ? 'Pend.' : 'Pago'}</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
