import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { DollarSign, CheckCircle, XCircle, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function PagamentosTab({ pacienteId, paciente }) {
  const [loading, setLoading] = useState(true)
  const [pagamentos, setPagamentos] = useState([])
  const [filtro, setFiltro] = useState('todos') // todos, pagos, pendentes
  const [resumo, setResumo] = useState({
    totalSessoes: 0,
    totalReceber: 0,
    totalRecebido: 0,
    saldoAberto: 0
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
    const totalSessoes = pagamentos.length
    const totalReceber = pagamentos.reduce((sum, p) => sum + parseFloat(p.valor_final || 0), 0)
    const totalRecebido = pagamentos
      .filter(p => p.pago)
      .reduce((sum, p) => sum + parseFloat(p.valor_final || 0), 0)
    const saldoAberto = totalReceber - totalRecebido

    setResumo({
      totalSessoes,
      totalReceber,
      totalRecebido,
      saldoAberto
    })
  }

  const handleTogglePago = async (pagamentoId, pagoAtual) => {
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

  const pagamentosFiltrados = pagamentos.filter(p => {
    if (filtro === 'pagos') return p.pago
    if (filtro === 'pendentes') return !p.pago
    return true
  })

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

      {/* Tabela de Pagamentos */}
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                {pagamentosFiltrados.map((pagamento) => (
                  <tr key={pagamento.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className="text-xs sm:text-sm text-gray-900">
                        {format(new Date(pagamento.data), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {pagamento.compareceu ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                      <span className="text-xs sm:text-sm text-gray-900">
                        R$ {parseFloat(pagamento.valor_sessao).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                      <span className="text-xs sm:text-sm text-gray-600">
                        {parseFloat(pagamento.desconto) > 0 ? `-R$ ${parseFloat(pagamento.desconto).toFixed(2)}` : '-'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        R$ {parseFloat(pagamento.valor_final).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
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
}

