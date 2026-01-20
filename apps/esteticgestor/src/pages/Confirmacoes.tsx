import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase, useAuth } from '@gestor/core'
import { Calendar, Clock, CheckCircle, XCircle, User, ArrowRight, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Função para criar Date a partir de string YYYY-MM-DD no fuso horário local
const parseLocalDate = (dateString: string | null) => {
  if (!dateString) return new Date()
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function Confirmacoes() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [confirmacoes, setConfirmacoes] = useState<any[]>([])
  const [filter, setFilter] = useState<'todas' | 'confirmadas' | 'canceladas'>('todas')

  useEffect(() => {
    if (user) {
      fetchConfirmacoes()
    }
  }, [user, filter])

  const fetchConfirmacoes = async () => {
    try {
      setLoading(true)
      
      // Buscar sessões agendadas com confirmação do paciente
      let query = supabase
        .from('sessoes_agendadas')
        .select(`
          *,
          pacientes!inner(
            id,
            nome_completo,
            telefone,
            psicologo_id
          )
        `)
        .eq('pacientes.psicologo_id', user.id)
        .not('confirmada_pelo_paciente', 'is', null)
        .not('confirmada_em', 'is', null)
        .order('confirmada_em', { ascending: false })

      // Aplicar filtro
      if (filter === 'confirmadas') {
        query = query.eq('confirmada_pelo_paciente', true)
      } else if (filter === 'canceladas') {
        query = query
          .eq('confirmada_pelo_paciente', false)
          .not('confirmada_em', 'is', null)
      }

      const { data, error } = await query

      if (error) throw error

      // Formatar dados
      const confirmacoesFormatadas = (data || []).map((sessao: any) => ({
        ...sessao,
        paciente_nome: sessao.pacientes.nome_completo,
        paciente_id: sessao.pacientes.id,
        paciente_telefone: sessao.pacientes.telefone
      }))

      setConfirmacoes(confirmacoesFormatadas)
    } catch (error) {
      console.error('Erro ao buscar confirmações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerPaciente = (pacienteId: string) => {
    navigate(`/pacientes/${pacienteId}`)
  }

  const getStatusBadge = (sessao: any) => {
    if (sessao.compareceu === true) {
      return (
        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Compareceu
        </span>
      )
    } else if (sessao.compareceu === false) {
      return (
        <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">
          <XCircle className="w-3 h-3" />
          Não Compareceu
        </span>
      )
    } else {
      return (
        <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-medium">
          <CalendarIcon className="w-3 h-3" />
          Agendado
        </span>
      )
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Confirmações de Sessões</h1>
            <p className="text-sm text-gray-600 mt-1">
              {confirmacoes.length} {confirmacoes.length === 1 ? 'confirmação encontrada' : 'confirmações encontradas'}
            </p>
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('todas')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'todas'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('confirmadas')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'confirmadas'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confirmadas
            </button>
            <button
              onClick={() => setFilter('canceladas')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'canceladas'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Canceladas
            </button>
          </div>
        </div>

        {/* Lista de Confirmações */}
        {confirmacoes.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Nenhuma confirmação encontrada</p>
            <p className="text-sm text-gray-500">
              {filter === 'todas' 
                ? 'As confirmações de sessões aparecerão aqui quando os pacientes confirmarem ou cancelarem'
                : filter === 'confirmadas'
                ? 'Nenhuma sessão confirmada pelo paciente'
                : 'Nenhuma sessão cancelada pelo paciente'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {confirmacoes.map((confirmacao) => (
              <div
                key={confirmacao.id}
                className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Informações Principais */}
                  <div className="flex-1 space-y-4">
                    {/* Paciente */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {confirmacao.paciente_nome}
                        </h3>
                        {confirmacao.paciente_telefone && (
                          <p className="text-sm text-gray-600 mt-1">
                            {confirmacao.paciente_telefone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Data e Hora da Sessão */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          <span className="font-medium">Sessão:</span>{' '}
                          {format(parseLocalDate(confirmacao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          <span className="font-medium">Horário:</span> {confirmacao.hora?.slice(0, 5)}
                        </span>
                      </div>
                    </div>

                    {/* Data e Hora da Confirmação */}
                    {confirmacao.confirmada_em && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span>
                          <span className="font-medium">
                            {confirmacao.confirmada_pelo_paciente ? 'Confirmada' : 'Cancelada'}
                          </span>{' '}
                          em {format(new Date(confirmacao.confirmada_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status e Ações */}
                  <div className="flex flex-col items-end gap-3">
                    {/* Status da Sessão */}
                    {getStatusBadge(confirmacao)}

                    {/* Badge de Confirmação/Cancelamento */}
                    {confirmacao.confirmada_pelo_paciente ? (
                      <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Confirmada pelo paciente
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-medium">
                        <XCircle className="w-3 h-3" />
                        Cancelada pelo paciente
                      </span>
                    )}

                    {/* Botão Ver Paciente */}
                    <button
                      onClick={() => handleVerPaciente(confirmacao.paciente_id)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition text-sm font-medium"
                    >
                      Ver Paciente
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
