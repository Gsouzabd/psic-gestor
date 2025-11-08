import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Calendar from '../components/Calendar'
import Modal from '../components/Modal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Users, Calendar as CalendarIcon, DollarSign, Clock, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import RecurrenceOptions from '../components/RecurrenceOptions'
import { generateRecurringAppointments } from '../utils/recurrence'

// Função para criar Date a partir de string YYYY-MM-DD no fuso horário local
const parseLocalDate = (dateString) => {
  if (!dateString) return new Date()
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPacientes: 0,
    sessoesSemana: 0,
    pagamentosPendentes: 0,
    ultimasSessoes: []
  })
  const [calendarSessions, setCalendarSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false)
  const [pacientes, setPacientes] = useState([])
  const [agendamentoForm, setAgendamentoForm] = useState({
    paciente_id: '',
    hora: '',
    data: '',
    isRecurring: false,
    tipoRecorrencia: 'semanal',
    dataFim: '',
    criarPrevisao: false
  })
  const [savingAgendamento, setSavingAgendamento] = useState(false)
  const [agendamentoError, setAgendamentoError] = useState('')

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      fetchPacientes()
    }
  }, [user])

  const fetchPacientes = async () => {
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

  const fetchDashboardData = async () => {
    try {
      // Total de pacientes
      const { count: totalPacientes } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .eq('psicologo_id', user.id)

      // Sessões da semana atual
      const hoje = new Date()
      const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()))
      const fimSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay() + 6))
      
      const { count: sessoesSemana } = await supabase
        .from('prontuarios')
        .select('*, pacientes!inner(psicologo_id)', { count: 'exact', head: true })
        .eq('pacientes.psicologo_id', user.id)
        .gte('data', inicioSemana.toISOString().split('T')[0])
        .lte('data', fimSemana.toISOString().split('T')[0])

      // Pagamentos pendentes
      const { data: pagamentosPendentesData } = await supabase
        .from('pagamentos')
        .select('valor_final, pacientes!inner(psicologo_id)')
        .eq('pacientes.psicologo_id', user.id)
        .eq('pago', false)

      const pagamentosPendentes = pagamentosPendentesData?.reduce((sum, p) => sum + parseFloat(p.valor_final || 0), 0) || 0

      // Últimas sessões
      const { data: ultimasSessoes } = await supabase
        .from('prontuarios')
        .select('*, pacientes!inner(id, nome_completo, psicologo_id)')
        .eq('pacientes.psicologo_id', user.id)
        .order('data', { ascending: false })
        .order('hora', { ascending: false })
        .limit(5)

      // Sessões para o calendário (próximos 60 dias)
      const { data: sessoes } = await supabase
        .from('prontuarios')
        .select('*, pacientes!inner(id, nome_completo, psicologo_id), recorrencia_id')
        .eq('pacientes.psicologo_id', user.id)
        .order('data', { ascending: true })

      const sessoesComNome = sessoes?.map(s => ({
        ...s,
        paciente_nome: s.pacientes.nome_completo
      })) || []

      setStats({
        totalPacientes: totalPacientes || 0,
        sessoesSemana: sessoesSemana || 0,
        pagamentosPendentes: pagamentosPendentes || 0,
        ultimasSessoes: ultimasSessoes || []
      })

      setCalendarSessions(sessoesComNome)
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEventClick = (session) => {
    setSelectedSession(session)
    setShowSessionModal(true)
  }

  const handleDayClick = (date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    // Calcular data final padrão (3 meses após a data inicial)
    const defaultEndDate = new Date(date)
    defaultEndDate.setMonth(defaultEndDate.getMonth() + 3)
    const defaultEndDateString = format(defaultEndDate, 'yyyy-MM-dd')
    
    setAgendamentoForm({
      paciente_id: '',
      hora: '',
      data: dateString,
      isRecurring: false,
      tipoRecorrencia: 'semanal',
      dataFim: defaultEndDateString,
      criarPrevisao: false
    })
    setShowAgendamentoModal(true)
    setAgendamentoError('')
  }

  const handleCreateAgendamento = async (e) => {
    e.preventDefault()
    setAgendamentoError('')
    setSavingAgendamento(true)

    try {
      if (!agendamentoForm.paciente_id || !agendamentoForm.hora) {
        setAgendamentoError('Por favor, preencha todos os campos obrigatórios.')
        setSavingAgendamento(false)
        return
      }

      if (agendamentoForm.isRecurring && (!agendamentoForm.tipoRecorrencia || !agendamentoForm.dataFim)) {
        setAgendamentoError('Para agendamentos recorrentes, preencha o tipo e a data final.')
        setSavingAgendamento(false)
        return
      }

      // Buscar valor da sessão do paciente
      const { data: paciente } = await supabase
        .from('pacientes')
        .select('valor_sessao')
        .eq('id', agendamentoForm.paciente_id)
        .single()

      const valorSessao = paciente?.valor_sessao || 0

      if (agendamentoForm.isRecurring) {
        // Criar recorrência
        const { data: recorrencia, error: recorrenciaError } = await supabase
          .from('recorrencias')
          .insert([
            {
              paciente_id: agendamentoForm.paciente_id,
              data_inicio: agendamentoForm.data,
              hora: agendamentoForm.hora,
              tipo_recorrencia: agendamentoForm.tipoRecorrencia,
              data_fim: agendamentoForm.dataFim,
              ativo: true
            }
          ])
          .select()
          .single()

        if (recorrenciaError) throw recorrenciaError

        // Gerar todos os agendamentos recorrentes
        const { prontuarios, errors } = await generateRecurringAppointments({
          dataInicio: agendamentoForm.data,
          hora: agendamentoForm.hora,
          tipoRecorrencia: agendamentoForm.tipoRecorrencia,
          dataFim: agendamentoForm.dataFim,
          pacienteId: agendamentoForm.paciente_id,
          recorrenciaId: recorrencia.id,
          valorSessao: valorSessao,
          criarPrevisao: agendamentoForm.criarPrevisao || false
        })

        if (errors.length > 0) {
          console.error('Erros ao criar alguns agendamentos:', errors)
          setAgendamentoError(`Agendamentos criados, mas alguns erros ocorreram: ${errors.length} erro(s)`)
        }
      } else {
        // Criar agendamento único
        const { data: prontuario, error: prontuarioError } = await supabase
          .from('prontuarios')
          .insert([
            {
              paciente_id: agendamentoForm.paciente_id,
              data: agendamentoForm.data,
              hora: agendamentoForm.hora,
              compareceu: null, // null = agendado
              anotacoes: ''
            }
          ])
          .select()
          .single()

        if (prontuarioError) throw prontuarioError

        // Criar pagamento vinculado
        const { error: pagamentoError } = await supabase
          .from('pagamentos')
          .insert([
            {
              prontuario_id: prontuario.id,
              paciente_id: agendamentoForm.paciente_id,
              data: agendamentoForm.data,
              valor_sessao: valorSessao,
              desconto: 0,
              compareceu: null, // null = agendado
              pago: false
            }
          ])

        if (pagamentoError) throw pagamentoError
      }

      // Fechar modal e recarregar dados
      setShowAgendamentoModal(false)
      setAgendamentoForm({
        paciente_id: '',
        hora: '',
        data: '',
        isRecurring: false,
        tipoRecorrencia: 'semanal',
        dataFim: '',
        criarPrevisao: false
      })
      fetchDashboardData()
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      setAgendamentoError('Erro ao criar agendamento. Tente novamente.')
    } finally {
      setSavingAgendamento(false)
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Visão geral dos seus atendimentos</p>
          </div>
          <button
            onClick={() => navigate('/pacientes?novo=true')}
            className="flex items-center justify-center gap-2 bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-opacity-90 transition shadow-sm hover:shadow-md text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Novo Paciente
          </button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total de Pacientes</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.totalPacientes}</p>
              </div>
              <div className="p-2 sm:p-3 bg-primary bg-opacity-10 rounded-lg flex-shrink-0">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Sessões da Semana</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.sessoesSemana}</p>
              </div>
              <div className="p-2 sm:p-3 bg-secondary bg-opacity-10 rounded-lg flex-shrink-0">
                <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pagamentos Pendentes</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                  R$ {stats.pagamentosPendentes.toFixed(2)}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Últimas 5 Sessões</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.ultimasSessoes.length}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Calendário */}
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Agenda de Sessões</h2>
          <Calendar sessions={calendarSessions} onEventClick={handleEventClick} onDayClick={handleDayClick} />
        </div>

        {/* Últimas Sessões */}
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Últimas Sessões</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {stats.ultimasSessoes.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm sm:text-base">Nenhuma sessão registrada ainda</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {stats.ultimasSessoes.map((sessao) => (
                  <div
                    key={sessao.id}
                    onClick={() => navigate(`/pacientes/${sessao.pacientes.id}?tab=prontuario`)}
                    className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{sessao.pacientes.nome_completo}</p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {format(parseLocalDate(sessao.data), "dd 'de' MMM", { locale: ptBR })} às {sessao.hora?.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {sessao.compareceu === true ? (
                          <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Compareceu</span>
                            <span className="sm:hidden">OK</span>
                          </span>
                        ) : sessao.compareceu === false ? (
                          <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Faltou</span>
                            <span className="sm:hidden">X</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                            <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Agendado</span>
                            <span className="sm:hidden">Ag</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes da Sessão */}
      <Modal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        title="Detalhes da Sessão"
        size="md"
      >
        {selectedSession && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Paciente</label>
              <p className="text-lg font-semibold text-gray-900">{selectedSession.paciente_nome}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Data</label>
                <p className="text-gray-900">
                  {format(parseLocalDate(selectedSession.data), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Hora</label>
                <p className="text-gray-900">{selectedSession.hora?.slice(0, 5)}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <div className="mt-1">
                {selectedSession.compareceu === true ? (
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    Compareceu
                  </span>
                ) : selectedSession.compareceu === false ? (
                  <span className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    Não compareceu
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-yellow-600">
                    <CalendarIcon className="w-5 h-5" />
                    Agendado
                  </span>
                )}
              </div>
            </div>
            {selectedSession.anotacoes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Anotações</label>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedSession.anotacoes}</p>
              </div>
            )}
            <button
              onClick={() => {
                navigate(`/pacientes/${selectedSession.pacientes.id}?tab=prontuario`)
                setShowSessionModal(false)
              }}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition"
            >
              Ver Prontuário Completo
            </button>
          </div>
        )}
      </Modal>

      {/* Modal de Novo Agendamento */}
      <Modal
        isOpen={showAgendamentoModal}
        onClose={() => {
          setShowAgendamentoModal(false)
          setAgendamentoForm({
            paciente_id: '',
            hora: '',
            data: '',
            isRecurring: false,
            tipoRecorrencia: 'semanal',
            dataFim: '',
            criarPrevisao: false
          })
          setAgendamentoError('')
        }}
        title="Novo Agendamento"
        size="md"
      >
        {agendamentoError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{agendamentoError}</span>
          </div>
        )}

        <form onSubmit={handleCreateAgendamento} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data *
            </label>
            <input
              type="date"
              value={agendamentoForm.data}
              onChange={(e) => setAgendamentoForm(prev => ({ ...prev, data: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              required
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora *
            </label>
            <input
              type="time"
              value={agendamentoForm.hora}
              onChange={(e) => setAgendamentoForm(prev => ({ ...prev, hora: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paciente *
            </label>
            <select
              value={agendamentoForm.paciente_id}
              onChange={(e) => setAgendamentoForm(prev => ({ ...prev, paciente_id: e.target.value }))}
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

          <RecurrenceOptions
            isRecurring={agendamentoForm.isRecurring}
            onRecurringChange={(value) => setAgendamentoForm(prev => ({ ...prev, isRecurring: value }))}
            tipoRecorrencia={agendamentoForm.tipoRecorrencia}
            onTipoRecorrenciaChange={(value) => setAgendamentoForm(prev => ({ ...prev, tipoRecorrencia: value }))}
            dataFim={agendamentoForm.dataFim}
            onDataFimChange={(value) => setAgendamentoForm(prev => ({ ...prev, dataFim: value }))}
            dataInicio={agendamentoForm.data}
            criarPrevisao={agendamentoForm.criarPrevisao}
            onCriarPrevisaoChange={(value) => setAgendamentoForm(prev => ({ ...prev, criarPrevisao: value }))}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAgendamentoModal(false)
                setAgendamentoForm({
                  paciente_id: '',
                  hora: '',
                  data: '',
                  isRecurring: false,
                  tipoRecorrencia: 'semanal',
                  dataFim: '',
                  criarPrevisao: false
                })
                setAgendamentoError('')
              }}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingAgendamento}
              className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {savingAgendamento ? 'Salvando...' : 'Agendar'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}

