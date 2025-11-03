import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { Save } from 'lucide-react'

export default function DadosPessoaisTab({ pacienteId, paciente, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { success, error: showError } = useToast()
  const [formData, setFormData] = useState({
    nome_completo: '',
    idade: '',
    data_nascimento: '',
    genero: '',
    telefone: '',
    email: '',
    endereco: '',
    profissao: '',
    escolaridade: '',
    valor_sessao: ''
  })

  useEffect(() => {
    if (paciente) {
      setFormData({
        nome_completo: paciente.nome_completo || '',
        idade: paciente.idade || '',
        data_nascimento: paciente.data_nascimento || '',
        genero: paciente.genero || '',
        telefone: paciente.telefone || '',
        email: paciente.email || '',
        endereco: paciente.endereco || '',
        profissao: paciente.profissao || '',
        escolaridade: paciente.escolaridade || '',
        valor_sessao: paciente.valor_sessao || ''
      })
    }
  }, [paciente])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updateData = {
        nome_completo: formData.nome_completo,
        idade: formData.idade ? parseInt(formData.idade) : null,
        data_nascimento: formData.data_nascimento || null,
        genero: formData.genero || null,
        telefone: formData.telefone || null,
        email: formData.email || null,
        endereco: formData.endereco || null,
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
    } catch (error) {
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

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Endereço
          </label>
          <input
            type="text"
            name="endereco"
            value={formData.endereco}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            placeholder="Rua, número, bairro, cidade - UF"
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
          <input
            type="text"
            name="escolaridade"
            value={formData.escolaridade}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            placeholder="Ex: Superior Completo"
          />
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

