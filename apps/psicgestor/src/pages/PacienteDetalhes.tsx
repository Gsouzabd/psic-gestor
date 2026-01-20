import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import DadosPessoaisTab from '../components/DadosPessoaisTab'
import AnamneseTab from '../components/AnamneseTab'
import ProntuarioTab from '../components/ProntuarioTab'
import PagamentosTab from '../components/PagamentosTab'
import SessoesAgendadasTab from '../components/SessoesAgendadasTab'
import { supabase, useAuth } from '@gestor/core'
import { ArrowLeft, User, FileText, DollarSign, Trash2, UserCircle, Calendar, Plus } from 'lucide-react'

export default function PacienteDetalhes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [paciente, setPaciente] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dados')

  useEffect(() => {
    fetchPaciente()
  }, [id])

  useEffect(() => {
    const tab = searchParams.get('tab')
    const validTabs = ['dados', 'anamnese', 'prontuario', 'pagamentos', 'sessoes-agendadas']
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const fetchPaciente = async () => {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setPaciente(data)
    } catch (error) {
      console.error('Erro ao buscar paciente:', error)
      navigate('/pacientes')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  const handleDeletePaciente = async () => {
    if (!paciente) return
    
    if (!confirm(`Tem certeza que deseja excluir o paciente "${paciente.nome_completo}"?\n\nEsta ação não pode ser desfeita e todos os dados relacionados (anamnese, prontuários e pagamentos) serão removidos.`)) {
      return
    }

    try {
      // Deletar prontuários e pagamentos relacionados
      const { data: prontuarios } = await supabase
        .from('prontuarios')
        .select('id')
        .eq('paciente_id', id)

      if (prontuarios && prontuarios.length > 0) {
        const prontuarioIds = prontuarios.map((p: any) => p.id)
        
        // Deletar pagamentos relacionados aos prontuários
        await supabase
          .from('pagamentos')
          .delete()
          .in('prontuario_id', prontuarioIds)

        // Deletar prontuários
        await supabase
          .from('prontuarios')
          .delete()
          .eq('paciente_id', id)
      }

      // Deletar pagamentos diretos (se houver)
      await supabase
        .from('pagamentos')
        .delete()
        .eq('paciente_id', id)

      // Deletar anamnese
      await supabase
        .from('anamneses')
        .delete()
        .eq('paciente_id', id)

      // Deletar paciente
      const { error } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Navegar de volta para a lista de pacientes
      navigate('/pacientes')
    } catch (error) {
      console.error('Erro ao deletar paciente:', error)
      alert('Erro ao deletar paciente. Tente novamente.')
    }
  }

  // Tabs específicos para psicólogo
  const tabs = [
    { id: 'dados', label: 'Dados Pessoais', icon: UserCircle },
    { id: 'anamnese', label: 'Anamnese', icon: User },
    { id: 'prontuario', label: 'Sessões Finalizadas', icon: FileText },
    { id: 'sessoes-agendadas', label: 'Sessões Agendadas', icon: Calendar },
    { id: 'pagamentos', label: 'Pagamentos', icon: DollarSign },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  if (!paciente) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-gray-600">Paciente não encontrado</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/pacientes')}
            className="p-2 hover:bg-white rounded-lg transition border border-gray-200 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{paciente.nome_completo}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
              {paciente.idade && `${paciente.idade} anos`}
              {paciente.idade && paciente.profissao && ' • '}
              {paciente.profissao}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/dashboard?paciente=${paciente.id}`)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nova Sessão</span>
            </button>
            <button
              onClick={handleDeletePaciente}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition border border-red-200 hover:border-red-300 text-sm sm:text-base"
              title="Excluir paciente"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Excluir</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex -mb-px min-w-full">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex-1 min-w-[100px] px-3 sm:px-6 py-3 sm:py-4 text-center font-medium transition flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base ${
                      activeTab === tab.id
                        ? 'border-b-2 border-primary text-primary bg-primary/10'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'dados' && <DadosPessoaisTab pacienteId={id!} paciente={paciente} onUpdate={fetchPaciente} />}
            {activeTab === 'anamnese' && <AnamneseTab pacienteId={id!} paciente={paciente} />}
            {activeTab === 'prontuario' && <ProntuarioTab pacienteId={id!} paciente={paciente} />}
            {activeTab === 'sessoes-agendadas' && <SessoesAgendadasTab pacienteId={id!} paciente={paciente} />}
            {activeTab === 'pagamentos' && <PagamentosTab pacienteId={id!} paciente={paciente} />}
          </div>
        </div>
      </div>
    </Layout>
  )
}
