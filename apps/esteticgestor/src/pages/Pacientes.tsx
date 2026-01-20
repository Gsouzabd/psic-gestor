import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { PatientCard, Modal, supabase, useAuth, useToast, buscarCEP, formatarCEP } from '@gestor/core'
import { Search, Plus, UserPlus, AlertCircle, Loader2 } from 'lucide-react'

export default function Pacientes() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [pacientes, setPacientes] = useState<any[]>([])
  const [filteredPacientes, setFilteredPacientes] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Formulário novo paciente
  const [formData, setFormData] = useState({
    nome_completo: '',
    apelido: '',
    idade: '',
    data_nascimento: '',
    genero: '',
    telefone: '',
    email: '',
    endereco: '',
    cep: '',
    rua: '',
    bairro: '',
    cidade: '',
    estado: '',
    profissao: '',
    escolaridade: '',
    valor_sessao: ''
  })
  const [buscandoCEP, setBuscandoCEP] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPacientes()
    }
    
    // Abrir modal se vier da query string
    if (searchParams.get('novo') === 'true') {
      setShowNewModal(true)
    }
  }, [user, searchParams])

  useEffect(() => {
    if (searchTerm) {
      const filtered = pacientes.filter((p: any) =>
        p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.telefone?.includes(searchTerm)
      )
      setFilteredPacientes(filtered)
    } else {
      setFilteredPacientes(pacientes)
    }
  }, [searchTerm, pacientes])

  const fetchPacientes = async () => {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('psicologo_id', user?.id)
        .order('nome_completo', { ascending: true })

      if (error) throw error
      setPacientes(data || [])
      setFilteredPacientes(data || [])
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    const cepFormatado = formatarCEP(value)
    setFormData(prev => ({
      ...prev,
      cep: cepFormatado
    }))
  }

  const handleCEPBlur = async () => {
    const cepLimpo = formData.cep.replace(/\D/g, '')
    if (cepLimpo.length === 8) {
      setBuscandoCEP(true)
      try {
        const dados = await buscarCEP(formData.cep)
        setFormData(prev => ({
          ...prev,
          rua: dados.rua,
          bairro: dados.bairro,
          cidade: dados.cidade,
          estado: dados.estado
        }))
        success('Endereço preenchido automaticamente!')
      } catch (error: any) {
        showError(error.message || 'Erro ao buscar CEP')
      } finally {
        setBuscandoCEP(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nome_completo: '',
      apelido: '',
      idade: '',
      data_nascimento: '',
      genero: '',
      telefone: '',
      email: '',
      endereco: '',
      cep: '',
      rua: '',
      bairro: '',
      cidade: '',
      estado: '',
      profissao: '',
      escolaridade: '',
      valor_sessao: ''
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('pacientes')
        .insert([
          {
            ...formData,
            psicologo_id: user?.id,
            idade: formData.idade ? parseInt(formData.idade) : null,
            valor_sessao: formData.valor_sessao ? parseFloat(formData.valor_sessao) : 0
          }
        ])
        .select()
        .single()

      if (error) {
        const message = error?.message || 'Erro ao criar paciente. Tente novamente.'
        showError(message)
        throw error
      }

      // Verificar se há mensagem no response de sucesso
      const responseMessage = data?.message

      // Criar anamnese vazia (usar upsert para evitar erro se já existir)
      const { error: anamneseError } = await supabase
        .from('anamneses')
        .upsert({ paciente_id: data.id }, {
          onConflict: 'paciente_id'
        })
      
      if (anamneseError) {
        console.warn('Erro ao criar anamnese vazia:', anamneseError)
        const anamneseMessage = anamneseError?.message
        if (anamneseMessage) {
          showError(anamneseMessage)
        }
      }

      const successMessage = responseMessage || 'Paciente criado com sucesso!'
      success(successMessage)

      setShowNewModal(false)
      resetForm()
      
      // Navegar para detalhes do paciente na aba de dados pessoais
      navigate(`/pacientes/${data.id}?tab=dados`)
    } catch (error: any) {
      console.error('Erro ao criar paciente:', error)
      const message = error?.message || 'Erro ao criar paciente. Tente novamente.'
      showError(message)
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePaciente = async (pacienteId: string, pacienteNome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o paciente "${pacienteNome}"?\n\nEsta ação não pode ser desfeita e todos os dados relacionados (anamnese, prontuários e pagamentos) serão removidos.`)) {
      return
    }

    try {
      // Deletar prontuários e pagamentos relacionados
      const { data: prontuarios } = await supabase
        .from('prontuarios')
        .select('id')
        .eq('paciente_id', pacienteId)

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
          .eq('paciente_id', pacienteId)
      }

      // Deletar pagamentos diretos (se houver)
      await supabase
        .from('pagamentos')
        .delete()
        .eq('paciente_id', pacienteId)

      // Deletar anamnese
      await supabase
        .from('anamneses')
        .delete()
        .eq('paciente_id', pacienteId)

      // Deletar paciente
      const { error, data } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', pacienteId)
        .select()

      if (error) {
        const message = error?.message || 'Erro ao deletar paciente. Tente novamente.'
        showError(message)
        throw error
      }

      // Verificar se há mensagem no response de sucesso
      const responseMessage = data?.message
      const successMessage = responseMessage || `Paciente "${pacienteNome}" excluído com sucesso!`
      success(successMessage)
      
      // Atualizar lista de pacientes
      fetchPacientes()
    } catch (error: any) {
      console.error('Erro ao deletar paciente:', error)
      const message = error?.message || 'Erro ao deletar paciente. Tente novamente.'
      showError(message)
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pacientes</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">{pacientes.length} pacientes cadastrados</p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center justify-center gap-2 bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-opacity-90 transition shadow-sm hover:shadow-md text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Novo Paciente
          </button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          />
        </div>

        {/* Lista de Pacientes */}
        {filteredPacientes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <UserPlus className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-400 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              {searchTerm 
                ? 'Tente buscar com outros termos' 
                : 'Comece adicionando seu primeiro paciente'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-2 bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-opacity-90 transition text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Adicionar Paciente
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPacientes.map((paciente: any) => (
              <PatientCard 
                key={paciente.id} 
                patient={paciente} 
                onDelete={() => handleDeletePaciente(paciente.id, paciente.nome_completo)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Novo Paciente */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Novo Paciente"
        size="lg"
      >
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apelido
              </label>
              <input
                type="text"
                name="apelido"
                value={formData.apelido}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Apelido opcional para notificações"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idade
              </label>
              <input
                type="number"
                name="idade"
                value={formData.idade}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Nascimento
              </label>
              <input
                type="date"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gênero
              </label>
              <select
                name="genero"
                value={formData.genero}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              >
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
                <option value="Prefiro não informar">Prefiro não informar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CEP
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="cep"
                  value={formData.cep}
                  onChange={handleCEPChange}
                  onBlur={handleCEPBlur}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="00000-000"
                  maxLength={9}
                />
                {buscandoCEP && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rua
              </label>
              <input
                type="text"
                name="rua"
                value={formData.rua}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Nome da rua/avenida"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bairro
              </label>
              <input
                type="text"
                name="bairro"
                value={formData.bairro}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Bairro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Cidade"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado (UF)
              </label>
              <input
                type="text"
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="SP"
                maxLength={2}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço Completo (opcional)
              </label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Endereço completo alternativo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profissão
              </label>
              <input
                type="text"
                name="profissao"
                value={formData.profissao}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escolaridade
              </label>
              <select
                name="escolaridade"
                value={formData.escolaridade}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              >
                <option value="">Selecione</option>
                <option value="Fundamental Incompleto">Fundamental Incompleto</option>
                <option value="Fundamental Completo">Fundamental Completo</option>
                <option value="Médio Incompleto">Médio Incompleto</option>
                <option value="Médio Completo">Médio Completo</option>
                <option value="Superior Incompleto">Superior Incompleto</option>
                <option value="Superior Completo">Superior Completo</option>
                <option value="Pós-graduação">Pós-graduação</option>
                <option value="Mestrado">Mestrado</option>
                <option value="Doutorado">Doutorado</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor por Sessão (R$)
              </label>
              <input
                type="number"
                step="0.01"
                name="valor_sessao"
                value={formData.valor_sessao}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Criar Paciente'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
