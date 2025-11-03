import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import FileUpload from './FileUpload'
import { useToast } from '../contexts/ToastContext'
import { Save } from 'lucide-react'

export default function AnamneseTab({ pacienteId, paciente }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { success, error: showError } = useToast()
  const [formData, setFormData] = useState({
    // Identificação dos Pais
    nome_pai: '',
    idade_pai: '',
    profissao_pai: '',
    telefone_pai: '',
    nome_mae: '',
    idade_mae: '',
    profissao_mae: '',
    telefone_mae: '',
    endereco_pais: '',
    // Atendimento
    frequencia_atendimento: '',
    data_hora_atendimento: '',
    // Queixa Principal
    queixa_principal: '',
    // Histórico
    psicoterapia_anterior: false,
    tempo_psicoterapia: '',
    acompanhamento_psiquiatrico: false,
    medicacao_atual: '',
    // Contato de Emergência
    nome_contato_emergencia: '',
    telefone_contato_emergencia: '',
    parentesco_contato_emergencia: '',
    // Contrato
    contrato_url: ''
  })

  useEffect(() => {
    fetchAnamnese()
  }, [pacienteId])

  const fetchAnamnese = async () => {
    try {
      const { data, error } = await supabase
        .from('anamneses')
        .select('*')
        .eq('paciente_id', pacienteId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setFormData({
          nome_pai: data.nome_pai || '',
          idade_pai: data.idade_pai || '',
          profissao_pai: data.profissao_pai || '',
          telefone_pai: data.telefone_pai || '',
          nome_mae: data.nome_mae || '',
          idade_mae: data.idade_mae || '',
          profissao_mae: data.profissao_mae || '',
          telefone_mae: data.telefone_mae || '',
          endereco_pais: data.endereco_pais || '',
          frequencia_atendimento: data.frequencia_atendimento || '',
          data_hora_atendimento: data.data_hora_atendimento ? data.data_hora_atendimento.slice(0, 16) : '',
          queixa_principal: data.queixa_principal || '',
          psicoterapia_anterior: data.psicoterapia_anterior || false,
          tempo_psicoterapia: data.tempo_psicoterapia || '',
          acompanhamento_psiquiatrico: data.acompanhamento_psiquiatrico || false,
          medicacao_atual: data.medicacao_atual || '',
          nome_contato_emergencia: data.nome_contato_emergencia || '',
          telefone_contato_emergencia: data.telefone_contato_emergencia || '',
          parentesco_contato_emergencia: data.parentesco_contato_emergencia || '',
          contrato_url: data.contrato_url || ''
        })
      }
    } catch (error) {
      console.error('Erro ao buscar anamnese:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error, data } = await supabase
        .from('anamneses')
        .upsert({
          paciente_id: pacienteId,
          ...formData,
          idade_pai: formData.idade_pai ? parseInt(formData.idade_pai) : null,
          idade_mae: formData.idade_mae ? parseInt(formData.idade_mae) : null,
        }, {
          onConflict: 'paciente_id'
        })

      if (error) {
        // Verificar se há mensagem no response do erro
        const errorMessage = error?.message
        if (errorMessage) {
          showError(errorMessage)
        }
        throw error
      }

      // Verificar se há mensagem no response de sucesso
      const responseMessage = data?.message
      if (responseMessage) {
        success(responseMessage)
      } else {
        success('Anamnese salva com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao salvar anamnese:', error)
      const message = error?.message || 'Erro ao salvar anamnese. Tente novamente.'
      showError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleFileUploaded = (url) => {
    setFormData(prev => ({ ...prev, contrato_url: url }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Identificação dos Pais */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          👨‍👩‍👧 Identificação dos Pais
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Pai</label>
            <input
              type="text"
              name="nome_pai"
              value={formData.nome_pai}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Idade</label>
            <input
              type="number"
              name="idade_pai"
              value={formData.idade_pai}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profissão</label>
            <input
              type="text"
              name="profissao_pai"
              value={formData.profissao_pai}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
            <input
              type="tel"
              name="telefone_pai"
              value={formData.telefone_pai}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>

          <div className="md:col-span-2 pt-4 border-t border-gray-200"></div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Mãe</label>
            <input
              type="text"
              name="nome_mae"
              value={formData.nome_mae}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Idade</label>
            <input
              type="number"
              name="idade_mae"
              value={formData.idade_mae}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profissão</label>
            <input
              type="text"
              name="profissao_mae"
              value={formData.profissao_mae}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
            <input
              type="tel"
              name="telefone_mae"
              value={formData.telefone_mae}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Endereço dos Pais</label>
            <input
              type="text"
              name="endereco_pais"
              value={formData.endereco_pais}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Atendimento */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          🕒 Atendimento
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frequência</label>
            <input
              type="text"
              name="frequencia_atendimento"
              value={formData.frequencia_atendimento}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="Ex: Semanal, Quinzenal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data/Hora padrão</label>
            <input
              type="datetime-local"
              name="data_hora_atendimento"
              value={formData.data_hora_atendimento}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Queixa Principal */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          💬 Queixa Principal
        </h3>
        
        <textarea
          name="queixa_principal"
          value={formData.queixa_principal}
          onChange={handleInputChange}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
          placeholder="Descreva a queixa principal do paciente..."
        />
      </div>

      {/* Histórico */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          📜 Histórico
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="psicoterapia_anterior"
              name="psicoterapia_anterior"
              checked={formData.psicoterapia_anterior}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <div className="flex-1">
              <label htmlFor="psicoterapia_anterior" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Já realizou psicoterapia antes?
              </label>
              {formData.psicoterapia_anterior && (
                <input
                  type="text"
                  name="tempo_psicoterapia"
                  value={formData.tempo_psicoterapia}
                  onChange={handleInputChange}
                  className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Por quanto tempo?"
                />
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="acompanhamento_psiquiatrico"
              name="acompanhamento_psiquiatrico"
              checked={formData.acompanhamento_psiquiatrico}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <div className="flex-1">
              <label htmlFor="acompanhamento_psiquiatrico" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Possui acompanhamento psiquiátrico?
              </label>
              {formData.acompanhamento_psiquiatrico && (
                <input
                  type="text"
                  name="medicacao_atual"
                  value={formData.medicacao_atual}
                  onChange={handleInputChange}
                  className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Faz uso de alguma medicação? Se sim, qual?"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contato de Emergência */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          🚨 Contato de Emergência
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Contato</label>
            <input
              type="text"
              name="nome_contato_emergencia"
              value={formData.nome_contato_emergencia}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="Nome completo do contato de emergência"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
            <input
              type="tel"
              name="telefone_contato_emergencia"
              value={formData.telefone_contato_emergencia}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Parentesco</label>
            <input
              type="text"
              name="parentesco_contato_emergencia"
              value={formData.parentesco_contato_emergencia}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="Ex: Pai, Mãe, Avó, Tio, etc."
            />
          </div>
        </div>
      </div>

      {/* Contrato */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          📄 Contrato
        </h3>
        
        <FileUpload
          pacienteId={pacienteId}
          currentFileUrl={formData.contrato_url}
          onFileUploaded={handleFileUploaded}
        />
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Anamnese'}
        </button>
      </div>
    </form>
  )
}


