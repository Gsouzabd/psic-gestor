import { useState, useEffect } from 'react'
import { supabase, useToast, buscarCEP, formatarCEP } from '@gestor/core'
import { Save, Loader2 } from 'lucide-react'

interface DadosPessoaisTabProps {
  pacienteId: string
  paciente: any
  onUpdate?: () => void
}

export default function DadosPessoaisTab({ pacienteId, paciente, onUpdate }: DadosPessoaisTabProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { success, error: showError } = useToast()
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
    if (paciente) {
      setFormData({
        nome_completo: paciente.nome_completo || '',
        apelido: paciente.apelido || '',
        idade: paciente.idade || '',
        data_nascimento: paciente.data_nascimento || '',
        genero: paciente.genero || '',
        telefone: paciente.telefone || '',
        email: paciente.email || '',
        endereco: paciente.endereco || '',
        cep: paciente.cep || '',
        rua: paciente.rua || '',
        bairro: paciente.bairro || '',
        cidade: paciente.cidade || '',
        estado: paciente.estado || '',
        profissao: paciente.profissao || '',
        escolaridade: paciente.escolaridade || '',
        valor_sessao: paciente.valor_sessao || ''
      })
    }
  }, [paciente])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updateData = {
        nome_completo: formData.nome_completo,
        apelido: formData.apelido || null,
        idade: formData.idade ? parseInt(formData.idade) : null,
        data_nascimento: formData.data_nascimento || null,
        genero: formData.genero || null,
        telefone: formData.telefone || null,
        email: formData.email || null,
        endereco: formData.endereco || null,
        cep: formData.cep || null,
        rua: formData.rua || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        profissao: formData.profissao || null,
        escolaridade: formData.escolaridade || null,
        valor_sessao: formData.valor_sessao ? parseFloat(formData.valor_sessao) : 0,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('pacientes')
        .update(updateData)
        .eq('id', pacienteId)

      if (error) throw error

      success('Dados pessoais atualizados com sucesso!')
      
      // Atualizar dados do paciente no componente pai
      if (onUpdate) {
        onUpdate()
      }
    } catch (error: any) {
      console.error('Erro ao atualizar dados pessoais:', error)
      const message = error?.message || 'Erro ao atualizar dados pessoais. Tente novamente.'
      showError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
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
            min="0"
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
            placeholder="(00) 00000-0000"
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
            placeholder="email@exemplo.com"
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
            min="0"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  )
}
