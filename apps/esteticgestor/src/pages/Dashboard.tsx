import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { Calendar, Session, Modal, supabase, useAuth, useToast, RecurrenceOptions, generateRecurringAppointments, notifyPatient } from '@gestor/core'
import { Users, Calendar as CalendarIcon, DollarSign, Clock, Plus, CheckCircle, XCircle, AlertCircle, MessageSquare, Video, MapPin, ExternalLink, Filter, Ban } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Função para abrir Google Meet em nova aba para criar reunião
const abrirGoogleMeet = () => {
  window.open('https://meet.google.com/new', '_blank')
}

// Função para criar Date a partir de string YYYY-MM-DD no fuso horário local
const parseLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date()
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [consultasHoje, setConsultasHoje] = useState([])
  const [stats, setStats] = useState({
    totalPacientes: 0,
    sessoesSemana: 0,
    pagamentosPendentes: 0,
    sessoesHoje: 0,
    ultimasSessoes: []
  })
  const [funilPagamento, setFunilPagamento] = useState({
    pago: 0,
    pendente: 0,
    atrasado: 0
  })
  const [calendarSessions, setCalendarSessions] = useState([])
  const [sessoesAgendadas, setSessoesAgendadas] = useState([])
  const [sessoesFiltradas, setSessoesFiltradas] = useState([])
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [selectedSession, setSelectedSession] = useState(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false)
  const [showReagendarModal, setShowReagendarModal] = useState(false)
  const [reagendarForm, setReagendarForm] = useState({ data: '', hora: '' })
  const [showMultipleSessionsModal, setShowMultipleSessionsModal] = useState(false)
  const [multipleSessions, setMultipleSessions] = useState([])
  const [multipleSessionsDate, setMultipleSessionsDate] = useState(null)
  const [notifyingSessaoId, setNotifyingSessaoId] = useState(null)
  const [notificationUseApelido, setNotificationUseApelido] = useState(false)
  const [notificationUseApelidoMap, setNotificationUseApelidoMap] = useState({})
  const [pacientes, setPacientes] = useState([])
  const [agendamentoForm, setAgendamentoForm] = useState({
    paciente_id: '',
    hora: '',
    data: '',
    isRecurring: false,
    tipoRecorrencia: 'semanal',
    dataFim: '',
    criarPrevisao: false,
    modalidadePagamento: 'por_sessao' as 'por_sessao' | 'unico',
    dataPagamentoUnico: '',
    tipo_consulta: 'presencial',
    link_meet: ''
  })
  const [savingAgendamento, setSavingAgendamento] = useState(false)
  const [agendamentoError, setAgendamentoError] = useState('')
  const [diasBloqueados, setDiasBloqueados] = useState<string[]>([])
  const [showBloquearDiaModal, setShowBloquearDiaModal] = useState(false)
  const [bloquearDiaForm, setBloquearDiaForm] = useState({ data: '', motivo: '' })
  
  // Filtros
  const [filtroPeriodo, setFiltroPeriodo] = useState('semana')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroPaciente, setFiltroPaciente] = useState('todos')

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

  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    
    try {
      const periodo = calcularPeriodo()
      
      // Total de pacientes
      const { count: totalPacientes } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .eq('psicologo_id', user.id)

      // Sessões do período (usando filtro)
      let queryProntuarios = supabase
        .from('prontuarios')
        .select('*, pacientes!inner(psicologo_id)', { count: 'exact', head: true })
        .eq('pacientes.psicologo_id', user.id)
        .gte('data', periodo.inicio)
        .lte('data', periodo.fim)
      
      let querySessoesAgendadas = supabase
        .from('sessoes_agendadas')
        .select('*, pacientes!inner(psicologo_id)', { count: 'exact', head: true })
        .eq('pacientes.psicologo_id', user.id)
        .is('compareceu', null)
        .gte('data', periodo.inicio)
        .lte('data', periodo.fim)
      
      // Aplicar filtro de paciente se não for "todos"
      if (filtroPaciente !== 'todos') {
        queryProntuarios = queryProntuarios.eq('paciente_id', filtroPaciente)
        querySessoesAgendadas = querySessoesAgendadas.eq('paciente_id', filtroPaciente)
      }
      
      const { count: prontuariosSemana } = await queryProntuarios
      const { count: sessoesAgendadasSemana } = await querySessoesAgendadas
      
      // Total de sessões do período = prontuários + sessões agendadas
      const sessoesSemana = (prontuariosSemana || 0) + (sessoesAgendadasSemana || 0)

      // Pagamentos pendentes (sem filtro de período para manter compatibilidade)
      let queryPagamentosPendentes = supabase
        .from('pagamentos')
        .select('valor_final, pacientes!inner(psicologo_id)')
        .eq('pacientes.psicologo_id', user.id)
        .eq('pago', false)
      
      if (filtroPaciente !== 'todos') {
        queryPagamentosPendentes = queryPagamentosPendentes.eq('paciente_id', filtroPaciente)
      }
      
      const { data: pagamentosPendentesData } = await queryPagamentosPendentes
      const pagamentosPendentes = pagamentosPendentesData?.reduce((sum, p) => sum + parseFloat(p.valor_final || 0), 0) || 0

      // Funil de pagamento (sem filtro de período para manter compatibilidade)
      const hojeStr = new Date().toISOString().split('T')[0]
      let queryTodosPagamentos = supabase
        .from('pagamentos')
        .select('valor_final, pago, data, pacientes!inner(psicologo_id)')
        .eq('pacientes.psicologo_id', user.id)
      
      if (filtroPaciente !== 'todos') {
        queryTodosPagamentos = queryTodosPagamentos.eq('paciente_id', filtroPaciente)
      }
      
      const { data: todosPagamentos } = await queryTodosPagamentos

      let pago = 0
      let pendente = 0
      let atrasado = 0

      if (todosPagamentos) {
        todosPagamentos.forEach(pagamento => {
          const valor = parseFloat(pagamento.valor_final) || 0
          if (pagamento.pago === true) {
            pago += valor
          } else {
            const dataPagamento = pagamento.data
            if (dataPagamento && dataPagamento < hojeStr) {
              atrasado += valor
            } else {
              pendente += valor
            }
          }
        })
      }

      setFunilPagamento({ pago, pendente, atrasado })

      // Sessões de hoje (usando hojeStr já declarado acima)
      // Contar prontuários de hoje
      const { count: prontuariosHoje } = await supabase
        .from('prontuarios')
        .select('*, pacientes!inner(psicologo_id)', { count: 'exact', head: true })
        .eq('pacientes.psicologo_id', user.id)
        .eq('data', hojeStr)
      
      // Contar sessões agendadas de hoje (status agendado - compareceu = null)
      const { count: sessoesAgendadasHoje } = await supabase
        .from('sessoes_agendadas')
        .select('*, pacientes!inner(psicologo_id)', { count: 'exact', head: true })
        .eq('pacientes.psicologo_id', user.id)
        .is('compareceu', null)
        .eq('data', hojeStr)
      
      // Total de sessões de hoje = prontuários + sessões agendadas
      const sessoesHoje = (prontuariosHoje || 0) + (sessoesAgendadasHoje || 0)

      // Últimas sessões
      const { data: ultimasSessoes } = await supabase
        .from('prontuarios')
        .select('*, pacientes!inner(id, nome_completo, psicologo_id)')
        .eq('pacientes.psicologo_id', user.id)
        .order('data', { ascending: false })
        .order('hora', { ascending: false })
        .limit(5)

      // Buscar sessões agendadas e prontuários para o calendário
      // Buscar sessões agendadas (incluindo campos de confirmação do paciente)
      const { data: sessoesAgendadasData } = await supabase
        .from('sessoes_agendadas')
        .select('*, pacientes!inner(id, nome_completo, apelido, psicologo_id), recorrencia_id, confirmada_pelo_paciente, confirmada_em, tipo_consulta, link_meet')
        .eq('pacientes.psicologo_id', user.id)
        .order('data', { ascending: true })
      
      setSessoesAgendadas(sessoesAgendadasData || [])
      aplicarFiltroSessoes(sessoesAgendadasData || [], filtroStatus)

      // Buscar prontuários (sessões que já aconteceram)
      const { data: prontuarios } = await supabase
        .from('prontuarios')
        .select('*, pacientes!inner(id, nome_completo, psicologo_id)')
        .eq('pacientes.psicologo_id', user.id)
        .not('compareceu', 'is', null)
        .order('data', { ascending: true })

      // Combinar sessões agendadas e prontuários
      const sessoesAgendadasComNome = sessoesAgendadasData?.map(s => ({
        ...s,
        paciente_nome: s.pacientes.nome_completo
      })) || []

      const prontuariosComNome = prontuarios?.map(p => ({
        ...p,
        paciente_nome: p.pacientes.nome_completo
      })) || []

      const sessoesComNome = [...sessoesAgendadasComNome, ...prontuariosComNome]

      setStats({
        totalPacientes: totalPacientes || 0,
        sessoesSemana: sessoesSemana || 0,
        pagamentosPendentes: pagamentosPendentes || 0,
        sessoesHoje: sessoesHoje || 0,
        ultimasSessoes: ultimasSessoes || []
      })

      setCalendarSessions(sessoesComNome)
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [user, filtroPeriodo, dataInicio, dataFim, filtroPaciente])

  // Função para buscar consultas do dia
  const fetchConsultasHoje = useCallback(async () => {
    if (!user) return
    
    try {
      const hojeStr = new Date().toISOString().split('T')[0]
      
      // Buscar sessões agendadas de hoje
      const { data: sessoesAgendadasHoje, error } = await supabase
        .from('sessoes_agendadas')
        .select('*, pacientes!inner(id, nome_completo, apelido, psicologo_id), confirmada_pelo_paciente, confirmada_em, tipo_consulta, link_meet')
        .eq('pacientes.psicologo_id', user.id)
        .eq('data', hojeStr)
        .is('compareceu', null)
        .order('hora', { ascending: true })
      
      if (error) throw error
      
      const consultas = (sessoesAgendadasHoje || []).map(s => ({
        ...s,
        paciente_nome: s.pacientes.nome_completo
      }))
      
      setConsultasHoje(consultas)
    } catch (error) {
      console.error('Erro ao buscar consultas do dia:', error)
    }
  }, [user])


  useEffect(() => {
    aplicarFiltroSessoes(sessoesAgendadas, filtroStatus)
  }, [filtroStatus, sessoesAgendadas])

  const aplicarFiltroSessoes = (sessoes: any[], filtro: string) => {
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

  const contarSessoesPorStatus = () => {
    return {
      todas: sessoesAgendadas.length,
      agendadas: sessoesAgendadas.filter(s => s.compareceu === null).length,
      confirmadas: sessoesAgendadas.filter(s => s.compareceu === true).length,
      canceladas: sessoesAgendadas.filter(s => s.compareceu === false).length
    }
  }

  const fetchDiasBloqueados = useCallback(async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('dias_bloqueados')
        .select('data')
        .eq('psicologo_id', user.id)
      
      if (error) throw error
      
      setDiasBloqueados((data || []).map((d: any) => d.data))
    } catch (error) {
      console.error('Erro ao buscar dias bloqueados:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      fetchPacientes()
      fetchDiasBloqueados()
    }
  }, [user, fetchDashboardData, fetchDiasBloqueados])

  // Verificar query param paciente e abrir modal
  useEffect(() => {
    const pacienteId = searchParams.get('paciente')
    if (pacienteId && pacientes.length > 0) {
      const hoje = new Date()
      const dateString = format(hoje, 'yyyy-MM-dd')
      const defaultEndDate = new Date(hoje)
      defaultEndDate.setMonth(defaultEndDate.getMonth() + 3)
      const defaultEndDateString = format(defaultEndDate, 'yyyy-MM-dd')
      
      setAgendamentoForm({
        paciente_id: pacienteId,
        hora: '',
        data: dateString,
        isRecurring: false,
        tipoRecorrencia: 'semanal',
        dataFim: defaultEndDateString,
        criarPrevisao: false,
        modalidadePagamento: 'por_sessao',
        dataPagamentoUnico: '',
        tipo_consulta: 'presencial',
        link_meet: ''
      })
      setShowAgendamentoModal(true)
      setAgendamentoError('')
      // Limpar query param
      navigate('/dashboard', { replace: true })
    }
  }, [searchParams, pacientes, navigate])

  // Verificar se é o primeiro login e mostrar diálogo de boas-vindas
  // Executar após o carregamento dos dados
  useEffect(() => {
    if (!user) return
    
    const welcomeShown = localStorage.getItem(`welcome_shown_${user.id}`)
    
    if (!welcomeShown) {
      // Aguardar o loading terminar
      const checkAndShow = async () => {
        if (loading) {
          // Se ainda estiver carregando, tentar novamente após um tempo
          setTimeout(checkAndShow, 300)
          return
        }
        
        // Carregar consultas e mostrar modal
        await fetchConsultasHoje()
        setShowWelcomeModal(true)
        localStorage.setItem(`welcome_shown_${user.id}`, 'true')
      }
      
      // Iniciar verificação após um pequeno delay para garantir que o componente está montado
      const timer = setTimeout(checkAndShow, 500)
      
      return () => clearTimeout(timer)
    }
  }, [user, loading, fetchConsultasHoje])

  // Escutar mudanças em tempo real nas sessões agendadas
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('sessoes_agendadas_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'sessoes_agendadas'
        },
        async (payload) => {
          console.log('Mudança detectada em sessões agendadas:', payload)
          
          // Verificar se a mudança é relevante para este psicólogo
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const sessaoId = payload.new?.id || payload.old?.id
            if (sessaoId) {
              // Buscar paciente para verificar se pertence ao psicólogo atual
              const { data: sessao } = await supabase
                .from('sessoes_agendadas')
                .select('paciente_id, pacientes!inner(psicologo_id)')
                .eq('id', sessaoId)
                .single()
              
              if (sessao?.pacientes?.psicologo_id === user.id) {
                // Recarregar dados do dashboard quando houver mudanças relevantes
                fetchDashboardData()
              }
            }
          } else if (payload.eventType === 'DELETE') {
            // Para DELETE, sempre recarregar (mais seguro)
            fetchDashboardData()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchDashboardData])

  const handleEventClick = (session: Session) => {
    setSelectedSession(session)
    setShowSessionModal(true)
  }

  const handleDayClick = (date: Date) => {
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
      criarPrevisao: false,
      tipo_consulta: 'presencial',
      link_meet: ''
    })
    setShowAgendamentoModal(true)
    setAgendamentoError('')
  }

  const handleMultipleSessionsClick = (date: Date, sessions: Session[]) => {
    setMultipleSessionsDate(date)
    // Ordenar sessões por hora
    const sortedSessions = [...sessions].sort((a, b) => {
      const horaA = a.hora || '00:00'
      const horaB = b.hora || '00:00'
      return horaA.localeCompare(horaB)
    })
    setMultipleSessions(sortedSessions)
    setShowMultipleSessionsModal(true)
  }

  const handleCreateAgendamento = async (e: React.FormEvent) => {
    e.preventDefault()
    setAgendamentoError('')
    setSavingAgendamento(true)

    try {
      if (!agendamentoForm.paciente_id || !agendamentoForm.hora) {
        setAgendamentoError('Por favor, preencha todos os campos obrigatórios.')
        setSavingAgendamento(false)
        return
      }

      // Validar se o dia está bloqueado
      if (diasBloqueados.includes(agendamentoForm.data)) {
        setAgendamentoError('Este dia está bloqueado e não permite agendamentos.')
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

        // Validar link do Meet se for online
        if (agendamentoForm.tipo_consulta === 'online' && !agendamentoForm.link_meet) {
          setAgendamentoError('Para consultas online, é necessário informar o link do Google Meet.')
          setSavingAgendamento(false)
          return
        }
        
        const linkMeet = agendamentoForm.tipo_consulta === 'online' 
          ? agendamentoForm.link_meet
          : null

        // Gerar todos os agendamentos recorrentes
        const { sessoesAgendadas, errors } = await generateRecurringAppointments({
          dataInicio: agendamentoForm.data,
          hora: agendamentoForm.hora,
          tipoRecorrencia: agendamentoForm.tipoRecorrencia,
          dataFim: agendamentoForm.dataFim,
          pacienteId: agendamentoForm.paciente_id,
          recorrenciaId: recorrencia.id,
          valorSessao: valorSessao,
          criarPrevisao: agendamentoForm.criarPrevisao || false,
          tipoConsulta: agendamentoForm.tipo_consulta,
          linkMeet: linkMeet,
          modalidadePagamento: agendamentoForm.modalidadePagamento,
          dataPagamentoUnico: agendamentoForm.dataPagamentoUnico || undefined
        })

        if (errors.length > 0) {
          console.error('Erros ao criar alguns agendamentos:', errors)
          setAgendamentoError(`Agendamentos criados, mas alguns erros ocorreram: ${errors.length} erro(s)`)
        }
      } else {
        // Validar link do Meet se for online
        if (agendamentoForm.tipo_consulta === 'online' && !agendamentoForm.link_meet) {
          setAgendamentoError('Para consultas online, é necessário informar o link do Google Meet.')
          setSavingAgendamento(false)
          return
        }
        
        const linkMeet = agendamentoForm.tipo_consulta === 'online' 
          ? agendamentoForm.link_meet
          : null

        // Criar agendamento único em sessoes_agendadas
        const { data: sessaoAgendada, error: sessaoError } = await supabase
          .from('sessoes_agendadas')
          .insert([
            {
              paciente_id: agendamentoForm.paciente_id,
              data: agendamentoForm.data,
              hora: agendamentoForm.hora,
              compareceu: null, // Ainda não foi marcado
              anotacoes: '',
              tipo_consulta: agendamentoForm.tipo_consulta,
              link_meet: linkMeet
            }
          ])
          .select()
          .single()

        if (sessaoError) throw sessaoError

        // Criar pagamento previsto apenas se criarPrevisao for true
        if (agendamentoForm.criarPrevisao) {
          if (agendamentoForm.modalidadePagamento === 'unico' && agendamentoForm.dataPagamentoUnico) {
            // Criar um único pagamento para todas as sessões
            const { error: pagamentoError } = await supabase
              .from('pagamentos')
              .insert([
                {
                  paciente_id: agendamentoForm.paciente_id,
                  data: agendamentoForm.dataPagamentoUnico,
                  valor_sessao: valorSessao,
                  desconto: 0,
                  compareceu: null,
                  pago: false,
                  previsao: true // Pagamento previsto
                }
              ])

            if (pagamentoError) throw pagamentoError
          } else {
            // Criar pagamento por sessão (comportamento padrão)
            const { error: pagamentoError } = await supabase
              .from('pagamentos')
              .insert([
                {
                  sessao_agendada_id: sessaoAgendada.id,
                  paciente_id: agendamentoForm.paciente_id,
                  data: agendamentoForm.data,
                  valor_sessao: valorSessao,
                  desconto: 0,
                  compareceu: null, // Ainda não foi marcado
                  pago: false,
                  previsao: true // Pagamento previsto
                }
              ])

            if (pagamentoError) throw pagamentoError
          }
        }
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
        criarPrevisao: false,
        modalidadePagamento: 'por_sessao',
        dataPagamentoUnico: '',
        tipo_consulta: 'presencial',
        link_meet: ''
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
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                const hoje = new Date()
                const dateString = format(hoje, 'yyyy-MM-dd')
                setBloquearDiaForm({ data: dateString, motivo: '' })
                setShowBloquearDiaModal(true)
              }}
              className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-opacity-90 transition shadow-sm hover:shadow-md text-sm sm:text-base flex-1 sm:flex-none"
            >
              <Ban className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Bloquear Dia</span>
            </button>
            <button
              onClick={() => {
                const hoje = new Date()
                const dateString = format(hoje, 'yyyy-MM-dd')
                const defaultEndDate = new Date(hoje)
                defaultEndDate.setMonth(defaultEndDate.getMonth() + 3)
                const defaultEndDateString = format(defaultEndDate, 'yyyy-MM-dd')
                
                setAgendamentoForm({
                  paciente_id: '',
                  hora: '',
                  data: dateString,
                  isRecurring: false,
                  tipoRecorrencia: 'semanal',
                  dataFim: defaultEndDateString,
                  criarPrevisao: false,
                  modalidadePagamento: 'por_sessao',
                  dataPagamentoUnico: '',
                  tipo_consulta: 'presencial',
                  link_meet: ''
                })
                setShowAgendamentoModal(true)
                setAgendamentoError('')
              }}
              className="flex items-center justify-center gap-2 bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-opacity-90 transition shadow-sm hover:shadow-md text-sm sm:text-base flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Nova Consulta
            </button>
          </div>
        </div>

        {/* Filtros */}
        {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
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
        </div> */}

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total de Pacientes</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.totalPacientes}</p>
              </div>
              <div className="p-2 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Consultas da Semana</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.sessoesSemana}</p>
              </div>
              <div className="p-2 sm:p-3 bg-secondary bg-opacity-10 rounded-lg flex-shrink-0">
                <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Consultas Hoje</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.sessoesHoje}</p>
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
          <Calendar 
            sessions={calendarSessions} 
            onEventClick={handleEventClick} 
            onDayClick={handleDayClick}
            onMultipleSessionsClick={handleMultipleSessionsClick}
            blockedDays={diasBloqueados}
          />
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
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center">
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
                        ) : sessao.confirmada_pelo_paciente === true ? (
                          <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Confirmada</span>
                            <span className="sm:hidden">Conf</span>
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
            {selectedSession.tipo_consulta && (
              <div>
                <label className="text-sm font-medium text-gray-600">Tipo de Consulta</label>
                <div className="mt-1">
                  {selectedSession.tipo_consulta === 'online' ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg">
                      <Video className="w-4 h-4" />
                      Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg">
                      <MapPin className="w-4 h-4" />
                      Presencial
                    </span>
                  )}
                </div>
                {selectedSession.tipo_consulta === 'online' && selectedSession.link_meet && (
                  <div className="mt-2">
                    <a
                      href={selectedSession.link_meet}
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
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <div className="mt-1 space-y-2">
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
                {selectedSession.confirmada_pelo_paciente === true && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="flex items-center gap-2 text-blue-600">
                      <CheckCircle className="w-5 h-5" />
                      Confirmada pelo paciente
                    </span>
                    {selectedSession.confirmada_em && (
                      <p className="text-xs text-gray-500 mt-1 ml-7">
                        Confirmada em: {format(new Date(selectedSession.confirmada_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                )}
                {selectedSession.confirmada_pelo_paciente === false && selectedSession.confirmada_em !== null && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-5 h-5" />
                      Cancelada pelo paciente
                    </span>
                    {selectedSession.confirmada_em && (
                      <p className="text-xs text-gray-500 mt-1 ml-7">
                        Cancelada em: {format(new Date(selectedSession.confirmada_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            {selectedSession.anotacoes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Anotações</label>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedSession.anotacoes}</p>
              </div>
            )}
            {/* Botão NOTIFICAR PACIENTE - apenas para sessões agendadas (compareceu === null) e não confirmadas */}
            {selectedSession.compareceu === null && selectedSession.id && selectedSession.confirmada_pelo_paciente !== true && (
              <div className="space-y-3">
                {selectedSession.pacientes?.apelido && selectedSession.pacientes.apelido.trim() !== '' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notificar como:
                    </label>
                    <select
                      value={notificationUseApelido ? 'apelido' : 'nome'}
                      onChange={(e) => setNotificationUseApelido(e.target.value === 'apelido')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    >
                      <option value="nome">Nome completo</option>
                      <option value="apelido">Apelido</option>
                    </select>
                  </div>
                )}
                <button
                  onClick={async () => {
                    try {
                      await notifyPatient(selectedSession.id, notificationUseApelido)
                      success('Notificação enviada com sucesso! O paciente receberá uma mensagem no WhatsApp.')
                      setNotificationUseApelido(false)
                    } catch (error) {
                      const message = error?.message || 'Erro ao enviar notificação. Tente novamente.'
                      showError(message)
                    }
                  }}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  NOTIFICAR PACIENTE
                </button>
              </div>
            )}
            {selectedSession.compareceu === null && (
              <div className="flex gap-3 border-t pt-4 mt-4">
                <button
                  onClick={() => {
                    setReagendarForm({
                      data: selectedSession.data,
                      hora: selectedSession.hora || ''
                    })
                    setShowReagendarModal(true)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Reagendar
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('Tem certeza que deseja marcar esta sessão como cancelada?')) {
                      return
                    }
                    try {
                      const { error } = await supabase
                        .from('sessoes_agendadas')
                        .update({ compareceu: false })
                        .eq('id', selectedSession.id)
                      
                      if (error) throw error
                      
                      success('Sessão marcada como cancelada com sucesso!')
                      setShowSessionModal(false)
                      fetchDashboardData()
                    } catch (error) {
                      console.error('Erro ao cancelar sessão:', error)
                      showError('Erro ao cancelar sessão. Tente novamente.')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition"
                >
                  Marcar Cancelamento
                </button>
              </div>
            )}
            <button
              onClick={() => {
                navigate(`/pacientes/${selectedSession.pacientes?.id || selectedSession.paciente_id}?tab=prontuario`)
                setShowSessionModal(false)
              }}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition"
            >
              Ver Prontuário Completo
            </button>
          </div>
        )}
      </Modal>

      {/* Modal de Múltiplas Sessões */}
      <Modal
        isOpen={showMultipleSessionsModal}
        onClose={() => {
          setShowMultipleSessionsModal(false)
          setMultipleSessions([])
          setMultipleSessionsDate(null)
        }}
        title={`Sessões do dia ${multipleSessionsDate ? format(multipleSessionsDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}`}
        size="md"
      >
        <div className="space-y-3">
          {multipleSessions.map((sessao) => {
            // Determinar cor baseado no status
            let statusColor = 'bg-yellow-100 text-yellow-800'
            let statusText = 'Agendado'
            if (sessao.compareceu === true) {
              statusColor = 'bg-green-100 text-green-800'
              statusText = 'Compareceu'
            } else if (sessao.compareceu === false) {
              statusColor = 'bg-red-100 text-red-800'
              statusText = 'Faltou'
            } else if (sessao.confirmada_pelo_paciente === true) {
              statusColor = 'bg-blue-100 text-blue-800'
              statusText = 'Confirmada'
            }

            return (
              <div
                key={sessao.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {sessao.paciente_nome}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {sessao.hora?.slice(0, 5)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedSession(sessao)
                      setShowMultipleSessionsModal(false)
                      setShowSessionModal(true)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition text-sm"
                  >
                    Ver Detalhes
                  </button>
                  {sessao.compareceu === null && sessao.id && sessao.confirmada_pelo_paciente !== true && (
                    <div className="flex gap-2">
                      {sessao.pacientes?.apelido && sessao.pacientes.apelido.trim() !== '' && (
                        <select
                          value={notificationUseApelidoMap[sessao.id] ? 'apelido' : 'nome'}
                          onChange={(e) => setNotificationUseApelidoMap(prev => ({
                            ...prev,
                            [sessao.id]: e.target.value === 'apelido'
                          }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                          disabled={notifyingSessaoId === sessao.id}
                        >
                          <option value="nome">Nome</option>
                          <option value="apelido">Apelido</option>
                        </select>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            setNotifyingSessaoId(sessao.id)
                            await notifyPatient(sessao.id, notificationUseApelidoMap[sessao.id] || false)
                            success('Notificação enviada com sucesso! O paciente receberá uma mensagem no WhatsApp.')
                            setNotificationUseApelidoMap(prev => {
                              const newMap = { ...prev }
                              delete newMap[sessao.id]
                              return newMap
                            })
                          } catch (error) {
                            const message = error?.message || 'Erro ao enviar notificação. Tente novamente.'
                            showError(message)
                          } finally {
                            setNotifyingSessaoId(null)
                          }
                        }}
                        disabled={notifyingSessaoId === sessao.id}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {notifyingSessaoId === sessao.id ? 'Enviando...' : 'Notificar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
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
        criarPrevisao: false,
        modalidadePagamento: 'por_sessao',
        dataPagamentoUnico: '',
        tipo_consulta: 'presencial',
        link_meet: ''
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Consulta *
            </label>
            <select
              value={agendamentoForm.tipo_consulta}
              onChange={(e) => {
                const tipo = e.target.value
                setAgendamentoForm(prev => ({ 
                  ...prev, 
                  tipo_consulta: tipo,
                  link_meet: tipo === 'presencial' ? '' : prev.link_meet
                }))
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              required
            >
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
            </select>
          </div>

          {agendamentoForm.tipo_consulta === 'online' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link do Google Meet *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={agendamentoForm.link_meet}
                  onChange={(e) => setAgendamentoForm(prev => ({ ...prev, link_meet: e.target.value }))}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  required={agendamentoForm.tipo_consulta === 'online'}
                />
                <button
                  type="button"
                  onClick={abrirGoogleMeet}
                  className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition font-medium flex items-center gap-2"
                  title="Abrir Google Meet para criar nova reunião"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden sm:inline">Criar Reunião</span>
                  <span className="sm:hidden">Criar</span>
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Clique em "Criar Reunião" para abrir o Google Meet e criar uma nova reunião. Depois, copie e cole o link aqui.
              </p>
            </div>
          )}

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
            modalidadePagamento={agendamentoForm.modalidadePagamento}
            onModalidadePagamentoChange={(value) => setAgendamentoForm(prev => ({ ...prev, modalidadePagamento: value }))}
            dataPagamentoUnico={agendamentoForm.dataPagamentoUnico}
            onDataPagamentoUnicoChange={(value) => setAgendamentoForm(prev => ({ ...prev, dataPagamentoUnico: value }))}
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
        criarPrevisao: false,
        modalidadePagamento: 'por_sessao',
        dataPagamentoUnico: '',
        tipo_consulta: 'presencial',
        link_meet: ''
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

      {/* Modal de Reagendar */}
      <Modal
        isOpen={showReagendarModal}
        onClose={() => {
          setShowReagendarModal(false)
          setReagendarForm({ data: '', hora: '' })
        }}
        title="Reagendar Sessão"
        size="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!selectedSession || !reagendarForm.data || !reagendarForm.hora) {
              showError('Por favor, preencha data e hora.')
              return
            }
            // Validar se o dia está bloqueado
            if (diasBloqueados.includes(reagendarForm.data)) {
              showError('Este dia está bloqueado e não permite agendamentos.')
              return
            }
            try {
              const { error } = await supabase
                .from('sessoes_agendadas')
                .update({
                  data: reagendarForm.data,
                  hora: reagendarForm.hora
                })
                .eq('id', selectedSession.id)
              
              if (error) throw error
              
              success('Sessão reagendada com sucesso!')
              setShowReagendarModal(false)
              setShowSessionModal(false)
              setReagendarForm({ data: '', hora: '' })
              fetchDashboardData()
            } catch (error) {
              console.error('Erro ao reagendar sessão:', error)
              showError('Erro ao reagendar sessão. Tente novamente.')
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Data *
            </label>
            <input
              type="date"
              value={reagendarForm.data}
              onChange={(e) => setReagendarForm(prev => ({ ...prev, data: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Hora *
            </label>
            <input
              type="time"
              value={reagendarForm.hora}
              onChange={(e) => setReagendarForm(prev => ({ ...prev, hora: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowReagendarModal(false)
                setReagendarForm({ data: '', hora: '' })
              }}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition"
            >
              Reagendar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Bloquear Dia */}
      <Modal
        isOpen={showBloquearDiaModal}
        onClose={() => {
          setShowBloquearDiaModal(false)
          setBloquearDiaForm({ data: '', motivo: '' })
        }}
        title="Bloquear Dia"
        size="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!bloquearDiaForm.data) {
              showError('Por favor, selecione uma data.')
              return
            }
            try {
              // Verificar se já está bloqueado
              if (diasBloqueados.includes(bloquearDiaForm.data)) {
                // Desbloquear
                const { error } = await supabase
                  .from('dias_bloqueados')
                  .delete()
                  .eq('psicologo_id', user?.id)
                  .eq('data', bloquearDiaForm.data)
                
                if (error) throw error
                success('Dia desbloqueado com sucesso!')
              } else {
                // Bloquear
                const { error } = await supabase
                  .from('dias_bloqueados')
                  .insert([
                    {
                      psicologo_id: user?.id,
                      data: bloquearDiaForm.data,
                      motivo: bloquearDiaForm.motivo || null
                    }
                  ])
                
                if (error) throw error
                success('Dia bloqueado com sucesso!')
              }
              
              setShowBloquearDiaModal(false)
              setBloquearDiaForm({ data: '', motivo: '' })
              fetchDiasBloqueados()
            } catch (error) {
              console.error('Erro ao bloquear/desbloquear dia:', error)
              showError('Erro ao bloquear/desbloquear dia. Tente novamente.')
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data *
            </label>
            <input
              type="date"
              value={bloquearDiaForm.data}
              onChange={(e) => setBloquearDiaForm(prev => ({ ...prev, data: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo (opcional)
            </label>
            <textarea
              value={bloquearDiaForm.motivo}
              onChange={(e) => setBloquearDiaForm(prev => ({ ...prev, motivo: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              rows={3}
              placeholder="Ex: Feriado, férias, etc."
            />
          </div>
          {diasBloqueados.includes(bloquearDiaForm.data) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Este dia já está bloqueado. Ao salvar, ele será desbloqueado.
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowBloquearDiaModal(false)
                setBloquearDiaForm({ data: '', motivo: '' })
              }}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition"
            >
              {diasBloqueados.includes(bloquearDiaForm.data) ? 'Desbloquear' : 'Bloquear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Boas-Vindas */}
      <Modal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        title="Bem-vindo!"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Olá, {profile?.nome_completo || 'Profissional'}! 👋
            </h3>
            <p className="text-gray-600">
              Aqui estão suas consultas de hoje:
            </p>
          </div>

          {consultasHoje.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">Nenhuma consulta agendada para hoje.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {consultasHoje.map((consulta) => {
                // Determinar status e cor
                let statusColor = 'bg-yellow-100 text-yellow-800'
                let statusText = 'Agendada'
                let statusIcon = <CalendarIcon className="w-4 h-4" />
                
                if (consulta.confirmada_pelo_paciente === true) {
                  statusColor = 'bg-blue-100 text-blue-800'
                  statusText = 'Confirmada'
                  statusIcon = <CheckCircle className="w-4 h-4" />
                }

                return (
                  <div
                    key={consulta.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {consulta.paciente_nome}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {consulta.hora?.slice(0, 5)}
                          </span>
                          {consulta.tipo_consulta && (
                            <span className="flex items-center gap-1">
                              {consulta.tipo_consulta === 'online' ? (
                                <>
                                  <Video className="w-4 h-4" />
                                  <span>Online</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="w-4 h-4" />
                                  <span>Presencial</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {statusIcon}
                        {statusText}
                      </span>
                    </div>
                    
                    {consulta.confirmada_pelo_paciente === true && consulta.confirmada_em && (
                      <p className="text-xs text-gray-500 mb-3">
                        Confirmada em: {format(new Date(consulta.confirmada_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedSession(consulta)
                          setShowWelcomeModal(false)
                          setShowSessionModal(true)
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition text-sm"
                      >
                        Ver Detalhes
                      </button>
                      {consulta.compareceu === null && consulta.id && consulta.confirmada_pelo_paciente !== true && (
                        <div className="flex gap-2">
                          {consulta.pacientes?.apelido && consulta.pacientes.apelido.trim() !== '' && (
                            <select
                              value={notificationUseApelidoMap[consulta.id] ? 'apelido' : 'nome'}
                              onChange={(e) => setNotificationUseApelidoMap(prev => ({
                                ...prev,
                                [consulta.id]: e.target.value === 'apelido'
                              }))}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                              disabled={notifyingSessaoId === consulta.id}
                            >
                              <option value="nome">Nome</option>
                              <option value="apelido">Apelido</option>
                            </select>
                          )}
                          <button
                            onClick={async () => {
                              try {
                                setNotifyingSessaoId(consulta.id)
                                await notifyPatient(consulta.id, notificationUseApelidoMap[consulta.id] || false)
                                success('Notificação enviada com sucesso! O paciente receberá uma mensagem no WhatsApp.')
                                setNotificationUseApelidoMap(prev => {
                                  const newMap = { ...prev }
                                  delete newMap[consulta.id]
                                  return newMap
                                })
                              } catch (error) {
                                const message = error?.message || 'Erro ao enviar notificação. Tente novamente.'
                                showError(message)
                              } finally {
                                setNotifyingSessaoId(null)
                              }
                            }}
                            disabled={notifyingSessaoId === consulta.id}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {notifyingSessaoId === consulta.id ? 'Enviando...' : 'Notificar'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition"
            >
              Entendi, obrigado!
            </button>
          </div>
        </div>
      </Modal>

    </Layout>
  )
}



