import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { DollarSign, CheckCircle, Clock, AlertCircle, Plus, Filter, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Função para criar Date a partir de string YYYY-MM-DD no fuso horário local
const parseLocalDate = (dateString) => {
  if (!dateString) return new Date()
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function DashboardFinanceiro() {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [pacientes, setPacientes] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  
  // Filtros
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroPaciente, setFiltroPaciente] = useState('todos')
  
  // Dashboard Financeiro
  const [dashboardFinanceiro, setDashboardFinanceiro] = useState({
    pago: 0,
    aReceber: 0,
    atrasado: 0
  })
  
  // Modal Novo Pagamento
  const [showNovoPagamentoModal, setShowNovoPagamentoModal] = useState(false)
  const [savingPagamento, setSavingPagamento] = useState(false)
  const [pagamentoError, setPagamentoError] = useState('')
  const [pagamentoForm, setPagamentoForm] = useState({
    paciente_id: '',
    data: '',
    valor_sessao: '',
    desconto: '0',
    pago: false
  })

  // Função para calcular período baseado no filtro
  const calcularPeriodo = () => {
    const hoje = new Date()
    let inicio, fim
    
    switch (filtroPeriodo) {
      case 'semana':
        const diaSemana = hoje.getDay()
        const diaMes = hoje.getDate()
        inicio = new Date(hoje)
        inicio.setDate(diaMes - diaSemana)
        fim = new Date(hoje)
        fim.setDate(diaMes - diaSemana + 6)
        break
      case 'mes':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        break
      case 'personalizado':
        inicio = dataInicio ? new Date(dataInicio) : new Date()
        fim = dataFim ? new Date(dataFim) : new Date()
        break
      default:
        inicio = new Date()
        fim = new Date()
    }
    
    return {
      inicio: inicio.toISOString().split('T')[0],
      fim: fim.toISOString().split('T')[0]
    }
  }

  const fetchPacientes = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, nome_completo')
        .eq('psicologo_id', user.id)
        .order('nome_completo', { ascending: true })

      if (error) throw error
      setPacientes(data || [])
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error)
    }
  }

  // Função para buscar pagamentos financeiros com filtros
  const fetchPagamentosFinanceiro = useCallback(async () => {
    if (!user) return
    
    try {
      const periodo = calcularPeriodo()
      const hojeStr = new Date().toISOString().split('T')[0]
      
      let query = supabase
        .from('pagamentos')
        .select('*, pacientes!inner(id, nome_completo, psicologo_id)')
        .eq('pacientes.psicologo_id', user.id)
        .gte('data', periodo.inicio)
        .lte('data', periodo.fim)
        .order('data', { ascending: false })
      
      // Aplicar filtro de paciente se não for "todos"
      if (filtroPaciente !== 'todos') {
        query = query.eq('paciente_id', filtroPaciente)
      }
      
      const { data: pagamentosData, error } = await query
      
      if (error) throw error
      
      setPagamentos(pagamentosData || [])
      
      let pago = 0
      let aReceber = 0
      let atrasado = 0
      
      if (pagamentosData) {
        pagamentosData.forEach(pagamento => {
          const valor = parseFloat(pagamento.valor_final) || 0
          if (pagamento.pago === true) {
            pago += valor
          } else {
            const dataPagamento = pagamento.data
            if (dataPagamento && dataPagamento < hojeStr) {
              atrasado += valor
            } else {
              aReceber += valor
            }
          }
        })
      }
      
      setDashboardFinanceiro({ pago, aReceber, atrasado })
    } catch (error) {
      console.error('Erro ao buscar pagamentos financeiros:', error)
    } finally {
      setLoading(false)
    }
  }, [user, filtroPeriodo, dataInicio, dataFim, filtroPaciente])

  useEffect(() => {
    if (user) {
      fetchPacientes()
      fetchPagamentosFinanceiro()
    }
  }, [user, fetchPagamentosFinanceiro])

  const handleTogglePago = async (pagamentoId, pagoAtual) => {
    try {
      const { error } = await supabase
        .from('pagamentos')
        .update({ pago: !pagoAtual })
        .eq('id', pagamentoId)

      if (error) throw error
      fetchPagamentosFinanceiro()
      success('Status do pagamento atualizado!')
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error)
      showError('Erro ao atualizar pagamento')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Controle financeiro completo</p>
          </div>
          <button
            onClick={() => {
              setPagamentoForm({
                paciente_id: '',
                data: format(new Date(), 'yyyy-MM-dd'),
                valor_sessao: '',
                desconto: '0',
                pago: false
              })
              setPagamentoError('')
              setShowNovoPagamentoModal(true)
            }}
            className="flex items-center justify-center gap-2 bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-opacity-90 transition shadow-sm hover:shadow-md text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Novo Pagamento
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Período
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                >
                  <option value="semana">Semana</option>
                  <option value="mes">Mês</option>
                  <option value="personalizado">Período Personalizado</option>
                </select>
                {filtroPeriodo === 'personalizado' && (
                  <>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder="Data inicial"
                    />
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder="Data final"
                    />
                  </>
                )}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paciente
              </label>
              <select
                value={filtroPaciente}
                onChange={(e) => setFiltroPaciente(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              >
                <option value="todos">Todos os pacientes</option>
                {pacientes.map((paciente) => (
                  <option key={paciente.id} value={paciente.id}>
                    {paciente.nome_completo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">PAGO</p>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              R$ {dashboardFinanceiro.pago.toFixed(2).replace('.', ',')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">A RECEBER</p>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
              R$ {dashboardFinanceiro.aReceber.toFixed(2).replace('.', ',')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">ATRASADO</p>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">
              R$ {dashboardFinanceiro.atrasado.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        {/* Lista de Pagamentos */}
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Pagamentos</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {pagamentos.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm sm:text-base">Nenhum pagamento encontrado no período selecionado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase">Paciente</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase">Valor</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase">Desc.</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pagamentos.map((pagamento) => (
                      <tr key={pagamento.id} className="hover:bg-gray-50 transition">
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="text-xs sm:text-sm text-gray-900">
                            {format(parseLocalDate(pagamento.data), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                          <span className="text-xs sm:text-sm text-gray-900">
                            {pagamento.pacientes?.nome_completo || 'N/A'}
                          </span>
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
                          {pagamento.pago ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              <span className="hidden sm:inline">Pago</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              <Clock className="w-3 h-3" />
                              <span className="hidden sm:inline">Pendente</span>
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
            )}
          </div>
        </div>
      </div>

      {/* Modal de Novo Pagamento */}
      <Modal
        isOpen={showNovoPagamentoModal}
        onClose={() => {
          setShowNovoPagamentoModal(false)
          setPagamentoForm({
            paciente_id: '',
            data: '',
            valor_sessao: '',
            desconto: '0',
            pago: false
          })
          setPagamentoError('')
        }}
        title="Novo Pagamento"
        size="md"
      >
        {pagamentoError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{pagamentoError}</span>
          </div>
        )}

        <form onSubmit={async (e) => {
          e.preventDefault()
          setPagamentoError('')
          setSavingPagamento(true)

          try {
            if (!pagamentoForm.paciente_id || !pagamentoForm.data || !pagamentoForm.valor_sessao) {
              setPagamentoError('Por favor, preencha todos os campos obrigatórios.')
              setSavingPagamento(false)
              return
            }

            const valorSessao = parseFloat(pagamentoForm.valor_sessao) || 0
            const desconto = parseFloat(pagamentoForm.desconto) || 0
            const valorFinal = valorSessao - desconto

            if (valorFinal < 0) {
              setPagamentoError('O valor final não pode ser negativo.')
              setSavingPagamento(false)
              return
            }

            const { error } = await supabase
              .from('pagamentos')
              .insert([
                {
                  paciente_id: pagamentoForm.paciente_id,
                  data: pagamentoForm.data,
                  valor_sessao: valorSessao,
                  desconto: desconto,
                  valor_final: valorFinal,
                  pago: pagamentoForm.pago,
                  compareceu: null,
                  previsao: false
                }
              ])

            if (error) throw error

            success('Pagamento criado com sucesso!')
            setShowNovoPagamentoModal(false)
            setPagamentoForm({
              paciente_id: '',
              data: format(new Date(), 'yyyy-MM-dd'),
              valor_sessao: '',
              desconto: '0',
              pago: false
            })
            fetchPagamentosFinanceiro()
          } catch (error) {
            console.error('Erro ao criar pagamento:', error)
            setPagamentoError('Erro ao criar pagamento. Tente novamente.')
          } finally {
            setSavingPagamento(false)
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paciente *
            </label>
            <select
              value={pagamentoForm.paciente_id}
              onChange={async (e) => {
                const pacienteId = e.target.value
                setPagamentoForm(prev => ({ ...prev, paciente_id: pacienteId }))
                
                // Buscar valor da sessão do paciente
                if (pacienteId) {
                  try {
                    const { data: paciente } = await supabase
                      .from('pacientes')
                      .select('valor_sessao')
                      .eq('id', pacienteId)
                      .single()
                    
                    if (paciente?.valor_sessao) {
                      setPagamentoForm(prev => ({ 
                        ...prev, 
                        valor_sessao: paciente.valor_sessao.toString()
                      }))
                    }
                  } catch (error) {
                    console.error('Erro ao buscar valor da sessão:', error)
                  }
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              required
            >
              <option value="">Selecione um paciente</option>
              {pacientes.map((paciente) => (
                <option key={paciente.id} value={paciente.id}>
                  {paciente.nome_completo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data *
            </label>
            <input
              type="date"
              value={pagamentoForm.data}
              onChange={(e) => setPagamentoForm(prev => ({ ...prev, data: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor da Sessão (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={pagamentoForm.valor_sessao}
              onChange={(e) => setPagamentoForm(prev => ({ ...prev, valor_sessao: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desconto (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={pagamentoForm.desconto}
              onChange={(e) => setPagamentoForm(prev => ({ ...prev, desconto: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Inicial
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pago"
                  checked={!pagamentoForm.pago}
                  onChange={() => setPagamentoForm(prev => ({ ...prev, pago: false }))}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Pendente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pago"
                  checked={pagamentoForm.pago}
                  onChange={() => setPagamentoForm(prev => ({ ...prev, pago: true }))}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Pago</span>
              </label>
            </div>
          </div>

          {pagamentoForm.valor_sessao && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Valor Final:</span>
                <span className="text-lg font-bold text-gray-900">
                  R$ {((parseFloat(pagamentoForm.valor_sessao) || 0) - (parseFloat(pagamentoForm.desconto) || 0)).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowNovoPagamentoModal(false)
                setPagamentoForm({
                  paciente_id: '',
                  data: format(new Date(), 'yyyy-MM-dd'),
                  valor_sessao: '',
                  desconto: '0',
                  pago: false
                })
                setPagamentoError('')
              }}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingPagamento}
              className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {savingPagamento ? 'Salvando...' : 'Criar Pagamento'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}

