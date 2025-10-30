import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import AnamneseTab from '../components/AnamneseTab'
import ProntuarioTab from '../components/ProntuarioTab'
import PagamentosTab from '../components/PagamentosTab'
import { supabase } from '../lib/supabase'
import { ArrowLeft, User, FileText, DollarSign } from 'lucide-react'

export default function PacienteDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [paciente, setPaciente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'anamnese')

  useEffect(() => {
    fetchPaciente()
  }, [id])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['anamnese', 'prontuario', 'pagamentos'].includes(tab)) {
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

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  const tabs = [
    { id: 'anamnese', label: 'Anamnese', icon: User },
    { id: 'prontuario', label: 'Prontuário', icon: FileText },
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
                        ? 'border-b-2 border-primary text-primary bg-primary bg-opacity-5'
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
            {activeTab === 'anamnese' && <AnamneseTab pacienteId={id} paciente={paciente} />}
            {activeTab === 'prontuario' && <ProntuarioTab pacienteId={id} paciente={paciente} />}
            {activeTab === 'pagamentos' && <PagamentosTab pacienteId={id} paciente={paciente} />}
          </div>
        </div>
      </div>
    </Layout>
  )
}

