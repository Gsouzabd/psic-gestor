import { useState, useEffect } from 'react'
import { supabase, useToast } from '@gestor/core'
import { Save } from 'lucide-react'

interface AvaliacaoCorporalTabProps {
  pacienteId: string
  paciente: any
}

export default function AvaliacaoCorporalTab({ pacienteId, paciente }: AvaliacaoCorporalTabProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { success, error: showError } = useToast()
  const [formData, setFormData] = useState({
    queixa_principal: '',
    feg_tipo: '',
    feg_grau: '',
    feg_localizacao: '',
    feg_coloracao_tecido: '',
    feg_temperatura: '',
    feg_dor_palpacao: false,
    feg_edema: '',
    feg_teste_cacifo: '',
    feg_digito_pressao: '',
    feg_sensacao_peso_cansaco_mmii: '',
    gordura_regionalizada_tipo: '',
    gordura_regionalizada_distribuicao: '',
    gordura_regionalizada_localizacao: '',
    biotipo: '',
    peso: '',
    altura: '',
    imc: '',
    classificacao_imc: '',
    peso_minimo: '',
    peso_maximo: '',
    flacidez_tissular_grau: '',
    flacidez_muscular_grau: '',
    flacidez_tissular_localizacao: '',
    flacidez_muscular_localizacao: '',
    estrias_cor: '',
    estrias_largura: '',
    estrias_tipo: '',
    estrias_quantidade: '',
    estrias_regiao: '',
    alteracoes_vasculares_microvasos_telangiectasias: false,
    alteracoes_vasculares_microvasos_telangiectasias_local: '',
    alteracoes_vasculares_coloracao: '',
    alteracoes_vasculares_insuficiencia_venosa: false,
    alteracoes_vasculares_insuficiencia_venosa_local: '',
    alteracoes_posturais: false,
    alteracoes_posturais_quais: '',
    perimetria_braco_d: '',
    perimetria_braco_e: '',
    perimetria_abdomen_superior: '',
    perimetria_abdomen_inferior: '',
    perimetria_cicatriz_umbilical: '',
    perimetria_quadril: '',
    perimetria_coxa_d: '',
    perimetria_coxa_e: '',
    perimetria_panturrilha_d: '',
    perimetria_panturrilha_e: '',
    adipometria_abdominal: '',
    adipometria_supra_iliaca: '',
    adipometria_triceps: '',
    adipometria_biceps: '',
    adipometria_toracica: '',
    adipometria_subescapular: '',
    percentual_gordura: '',
    tabela_por_datas: '',
    bioimpedancia_taxa_gordura: '',
    bioimpedancia_hidratacao: '',
    bioimpedancia_massa_magra: '',
    bioimpedancia_taxa_metabolica: '',
    proposta_tratamento: ''
  })

  useEffect(() => {
    fetchAvaliacao()
  }, [pacienteId])

  const fetchAvaliacao = async () => {
    try {
      const { data, error } = await supabase
        .from('avaliacao_corporal')
        .select('*')
        .eq('paciente_id', pacienteId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setFormData(data)
      }
    } catch (error) {
      console.error('Erro ao buscar avaliação corporal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : parseFloat(value)) : value)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const submitData = {
        paciente_id: pacienteId,
        ...formData,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        imc: formData.imc ? parseFloat(formData.imc) : null,
        peso_minimo: formData.peso_minimo ? parseFloat(formData.peso_minimo) : null,
        peso_maximo: formData.peso_maximo ? parseFloat(formData.peso_maximo) : null
      }

      const { error } = await supabase
        .from('avaliacao_corporal')
        .upsert(submitData, {
          onConflict: 'paciente_id'
        })

      if (error) throw error

      success('Avaliação Corporal salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar avaliação corporal:', error)
      showError('Erro ao salvar avaliação corporal. Tente novamente.')
    } finally {
      setSaving(false)
    }
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
      {/* Queixa Principal */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Queixa Principal
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Queixa Principal</label>
          <textarea
            name="queixa_principal"
            value={formData.queixa_principal}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
          />
        </div>
      </div>

      {/* Fibro Edema Gelóide (FEG) */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Fibro Edema Gelóide (FEG)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <input
              type="text"
              name="feg_tipo"
              value={formData.feg_tipo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grau</label>
            <input
              type="text"
              name="feg_grau"
              value={formData.feg_grau}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Localização</label>
            <input
              type="text"
              name="feg_localizacao"
              value={formData.feg_localizacao}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Coloração do tecido</label>
            <input
              type="text"
              name="feg_coloracao_tecido"
              value={formData.feg_coloracao_tecido}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Temperatura</label>
            <input
              type="text"
              name="feg_temperatura"
              value={formData.feg_temperatura}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="feg_dor_palpacao"
              name="feg_dor_palpacao"
              checked={formData.feg_dor_palpacao}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="feg_dor_palpacao" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Dor à palpação
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Edema</label>
            <input
              type="text"
              name="feg_edema"
              value={formData.feg_edema}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teste do cacifo</label>
            <input
              type="text"
              name="feg_teste_cacifo"
              value={formData.feg_teste_cacifo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Digito-pressão</label>
            <input
              type="text"
              name="feg_digito_pressao"
              value={formData.feg_digito_pressao}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sensação de peso/cansaço em MMII</label>
            <input
              type="text"
              name="feg_sensacao_peso_cansaco_mmii"
              value={formData.feg_sensacao_peso_cansaco_mmii}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Gordura Regionalizada */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Gordura Regionalizada
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <input
              type="text"
              name="gordura_regionalizada_tipo"
              value={formData.gordura_regionalizada_tipo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Distribuição</label>
            <input
              type="text"
              name="gordura_regionalizada_distribuicao"
              value={formData.gordura_regionalizada_distribuicao}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Localização</label>
            <input
              type="text"
              name="gordura_regionalizada_localizacao"
              value={formData.gordura_regionalizada_localizacao}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Biotipo</label>
            <input
              type="text"
              name="biotipo"
              value={formData.biotipo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Peso / Altura / IMC */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Peso / Altura / IMC
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              name="peso"
              value={formData.peso}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Altura (m)</label>
            <input
              type="number"
              step="0.01"
              name="altura"
              value={formData.altura}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">IMC</label>
            <input
              type="number"
              step="0.1"
              name="imc"
              value={formData.imc}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Classificação do IMC</label>
            <input
              type="text"
              name="classificacao_imc"
              value={formData.classificacao_imc}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Peso mínimo (kg)</label>
            <input
              type="number"
              step="0.1"
              name="peso_minimo"
              value={formData.peso_minimo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Peso máximo (kg)</label>
            <input
              type="number"
              step="0.1"
              name="peso_maximo"
              value={formData.peso_maximo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Flacidez */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Flacidez
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tissular (grau)</label>
            <input
              type="text"
              name="flacidez_tissular_grau"
              value={formData.flacidez_tissular_grau}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Muscular (grau de força)</label>
            <input
              type="text"
              name="flacidez_muscular_grau"
              value={formData.flacidez_muscular_grau}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Localização tissular</label>
            <input
              type="text"
              name="flacidez_tissular_localizacao"
              value={formData.flacidez_tissular_localizacao}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Localização muscular</label>
            <input
              type="text"
              name="flacidez_muscular_localizacao"
              value={formData.flacidez_muscular_localizacao}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Estrias */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Estrias
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
            <input
              type="text"
              name="estrias_cor"
              value={formData.estrias_cor}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Largura</label>
            <input
              type="text"
              name="estrias_largura"
              value={formData.estrias_largura}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <input
              type="text"
              name="estrias_tipo"
              value={formData.estrias_tipo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
            <input
              type="text"
              name="estrias_quantidade"
              value={formData.estrias_quantidade}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Região</label>
            <input
              type="text"
              name="estrias_regiao"
              value={formData.estrias_regiao}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Alterações Vasculares */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Alterações Vasculares
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="alteracoes_vasculares_microvasos_telangiectasias"
              name="alteracoes_vasculares_microvasos_telangiectasias"
              checked={formData.alteracoes_vasculares_microvasos_telangiectasias}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <div className="flex-1">
              <label htmlFor="alteracoes_vasculares_microvasos_telangiectasias" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Microvasos/telangiectasias
              </label>
              {formData.alteracoes_vasculares_microvasos_telangiectasias && (
                <input
                  type="text"
                  name="alteracoes_vasculares_microvasos_telangiectasias_local"
                  value={formData.alteracoes_vasculares_microvasos_telangiectasias_local}
                  onChange={handleInputChange}
                  className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Local"
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Coloração</label>
            <input
              type="text"
              name="alteracoes_vasculares_coloracao"
              value={formData.alteracoes_vasculares_coloracao}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="alteracoes_vasculares_insuficiencia_venosa"
              name="alteracoes_vasculares_insuficiencia_venosa"
              checked={formData.alteracoes_vasculares_insuficiencia_venosa}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <div className="flex-1">
              <label htmlFor="alteracoes_vasculares_insuficiencia_venosa" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Insuficiência venosa
              </label>
              {formData.alteracoes_vasculares_insuficiencia_venosa && (
                <input
                  type="text"
                  name="alteracoes_vasculares_insuficiencia_venosa_local"
                  value={formData.alteracoes_vasculares_insuficiencia_venosa_local}
                  onChange={handleInputChange}
                  className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Local"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alterações Posturais */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Alterações Posturais
        </h3>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="alteracoes_posturais"
            name="alteracoes_posturais"
            checked={formData.alteracoes_posturais}
            onChange={handleInputChange}
            className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <div className="flex-1">
            <label htmlFor="alteracoes_posturais" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Alterações posturais
            </label>
            {formData.alteracoes_posturais && (
              <input
                type="text"
                name="alteracoes_posturais_quais"
                value={formData.alteracoes_posturais_quais}
                onChange={handleInputChange}
                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Quais?"
              />
            )}
          </div>
        </div>
      </div>

      {/* Perimetria */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Perimetria
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Braço D</label>
            <input
              type="text"
              name="perimetria_braco_d"
              value={formData.perimetria_braco_d}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Braço E</label>
            <input
              type="text"
              name="perimetria_braco_e"
              value={formData.perimetria_braco_e}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Abdômen Superior</label>
            <input
              type="text"
              name="perimetria_abdomen_superior"
              value={formData.perimetria_abdomen_superior}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Abdômen Inferior</label>
            <input
              type="text"
              name="perimetria_abdomen_inferior"
              value={formData.perimetria_abdomen_inferior}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cicatriz umbilical</label>
            <input
              type="text"
              name="perimetria_cicatriz_umbilical"
              value={formData.perimetria_cicatriz_umbilical}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quadril</label>
            <input
              type="text"
              name="perimetria_quadril"
              value={formData.perimetria_quadril}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Coxa D</label>
            <input
              type="text"
              name="perimetria_coxa_d"
              value={formData.perimetria_coxa_d}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Coxa E</label>
            <input
              type="text"
              name="perimetria_coxa_e"
              value={formData.perimetria_coxa_e}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Panturrilha D</label>
            <input
              type="text"
              name="perimetria_panturrilha_d"
              value={formData.perimetria_panturrilha_d}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Panturrilha E</label>
            <input
              type="text"
              name="perimetria_panturrilha_e"
              value={formData.perimetria_panturrilha_e}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Adipometria */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Adipometria
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Abdominal</label>
            <input
              type="text"
              name="adipometria_abdominal"
              value={formData.adipometria_abdominal}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supra-ilíaca</label>
            <input
              type="text"
              name="adipometria_supra_iliaca"
              value={formData.adipometria_supra_iliaca}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tríceps</label>
            <input
              type="text"
              name="adipometria_triceps"
              value={formData.adipometria_triceps}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bíceps</label>
            <input
              type="text"
              name="adipometria_biceps"
              value={formData.adipometria_biceps}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Torácica</label>
            <input
              type="text"
              name="adipometria_toracica"
              value={formData.adipometria_toracica}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subescapular</label>
            <input
              type="text"
              name="adipometria_subescapular"
              value={formData.adipometria_subescapular}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Percentual de Gordura</label>
            <input
              type="text"
              name="percentual_gordura"
              value={formData.percentual_gordura}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tabela por datas</label>
            <textarea
              name="tabela_por_datas"
              value={formData.tabela_por_datas}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
            />
          </div>
        </div>
      </div>

      {/* Bioimpedância */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Bioimpedância
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Taxa de gordura</label>
            <input
              type="text"
              name="bioimpedancia_taxa_gordura"
              value={formData.bioimpedancia_taxa_gordura}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hidratação</label>
            <input
              type="text"
              name="bioimpedancia_hidratacao"
              value={formData.bioimpedancia_hidratacao}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Massa magra</label>
            <input
              type="text"
              name="bioimpedancia_massa_magra"
              value={formData.bioimpedancia_massa_magra}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Taxa metabólica</label>
            <input
              type="text"
              name="bioimpedancia_taxa_metabolica"
              value={formData.bioimpedancia_taxa_metabolica}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Proposta de Tratamento */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Proposta de Tratamento
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Proposta de Tratamento</label>
          <textarea
            name="proposta_tratamento"
            value={formData.proposta_tratamento}
            onChange={handleInputChange}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
            placeholder="Descreva a proposta de tratamento..."
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Avaliação Corporal'}
        </button>
      </div>
    </form>
  )
}

