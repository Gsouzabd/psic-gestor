import { useState, useEffect } from 'react'
import { supabase, useToast } from '@gestor/core'
import { Save } from 'lucide-react'

interface AvaliacaoGeralTabProps {
  pacienteId: string
  paciente: any
}

export default function AvaliacaoGeralTab({ pacienteId, paciente }: AvaliacaoGeralTabProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { success, error: showError } = useToast()
  const [formData, setFormData] = useState({
    queixa: '',
    duracao: '',
    habitos_diarios: '',
    tratamento_estetico_anterior: false,
    tratamento_estetico_anterior_qual: '',
    usa_lentes_contato: false,
    utilizacao_cosmeticos: false,
    utilizacao_cosmeticos_qual: '',
    exposicao_sol: false,
    filtro_solar: false,
    filtro_solar_frequencia: '',
    tabagismo: false,
    tabagismo_quantidade: '',
    ingere_bebida_alcoolica: false,
    ingere_bebida_alcoolica_frequencia: '',
    funcionamento_intestinal: '',
    qualidade_sono: '',
    qualidade_sono_horas: '',
    tempo_pe_sentada: false,
    tempo_pe_sentada_tempo: '',
    ingestao_agua: '',
    tipo_alimentacao: '',
    alimentos_preferencia: '',
    pratica_atividade_fisica: false,
    pratica_atividade_fisica_tipo: '',
    pratica_atividade_fisica_frequencia: '',
    uso_anticoncepcional: false,
    uso_anticoncepcional_qual: '',
    data_ultima_menstruacao: '',
    gestante: false,
    gestacoes: false,
    gestacoes_quantidade: '',
    gestacoes_tempo: '',
    historico_clinico: '',
    tratamento_medico_atual: false,
    tratamento_medico_atual_medicamentos: '',
    uso_anticoagulantes: false,
    uso_anticoagulantes_quais: '',
    alergias: false,
    alergias_quais: '',
    reacao_anestesicos: false,
    marcapasso: false,
    alteracoes_cardiacas: false,
    alteracoes_cardiacas_quais: '',
    hipo_hipertensao: false,
    disturbio_circulatorio: false,
    disturbio_circulatorio_qual: '',
    disturbio_renal: false,
    disturbio_renal_qual: '',
    disturbio_hormonal: false,
    disturbio_hormonal_qual: '',
    disturbio_gastrointestinal: false,
    disturbio_gastrointestinal_qual: '',
    epilepsia_convulsoes: false,
    epilepsia_convulsoes_frequencia: '',
    alteracoes_psicologicas_psiquiatricas: false,
    alteracoes_psicologicas_psiquiatricas_quais: '',
    estresse: false,
    estresse_observacoes: '',
    antecedentes_oncologicos: false,
    antecedentes_oncologicos_qual: '',
    diabetes: false,
    diabetes_tipo: '',
    doenca_autoimune: false,
    doenca_autoimune_qual: '',
    soropositivo: false,
    outra_condicao: '',
    data_ultimo_checkup: '',
    proteses_metalicas: false,
    proteses_metalicas_qual: '',
    implante_dentario: false,
    tratamento_dermatologico_estetico: false,
    tratamento_dermatologico_estetico_qual: '',
    cirurgia_plastica_estetica: false,
    cirurgia_plastica_estetica_qual: '',
    cirurgia_reparadora: false,
    cirurgia_reparadora_qual: ''
  })

  useEffect(() => {
    fetchAvaliacao()
  }, [pacienteId])

  const fetchAvaliacao = async () => {
    try {
      const { data, error } = await supabase
        .from('avaliacao_geral')
        .select('*')
        .eq('paciente_id', pacienteId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        const formattedData = { ...data }
        // Formatar datas
        if (data.data_ultima_menstruacao) {
          formattedData.data_ultima_menstruacao = data.data_ultima_menstruacao
        }
        if (data.data_ultimo_checkup) {
          formattedData.data_ultimo_checkup = data.data_ultimo_checkup
        }
        setFormData(formattedData)
      }
    } catch (error) {
      console.error('Erro ao buscar avaliação geral:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const submitData = {
        paciente_id: pacienteId,
        ...formData,
        data_ultima_menstruacao: formData.data_ultima_menstruacao || null,
        data_ultimo_checkup: formData.data_ultimo_checkup || null
      }

      const { error } = await supabase
        .from('avaliacao_geral')
        .upsert(submitData, {
          onConflict: 'paciente_id'
        })

      if (error) throw error

      success('Avaliação Geral salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar avaliação geral:', error)
      showError('Erro ao salvar avaliação geral. Tente novamente.')
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
      {/* Queixa */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Queixa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Queixa</label>
            <input
              type="text"
              name="queixa"
              value={formData.queixa}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duração</label>
            <input
              type="text"
              name="duracao"
              value={formData.duracao}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Hábitos Diários */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Hábitos Diários
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hábitos Diários</label>
            <textarea
              name="habitos_diarios"
              value={formData.habitos_diarios}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="tratamento_estetico_anterior"
                name="tratamento_estetico_anterior"
                checked={formData.tratamento_estetico_anterior}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="tratamento_estetico_anterior" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Tratamento estético anterior
                </label>
                {formData.tratamento_estetico_anterior && (
                  <input
                    type="text"
                    name="tratamento_estetico_anterior_qual"
                    value={formData.tratamento_estetico_anterior_qual}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Qual?"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="usa_lentes_contato"
                name="usa_lentes_contato"
                checked={formData.usa_lentes_contato}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="usa_lentes_contato" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Usa lentes de contato
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="utilizacao_cosmeticos"
                name="utilizacao_cosmeticos"
                checked={formData.utilizacao_cosmeticos}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="utilizacao_cosmeticos" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Utilização de cosméticos
                </label>
                {formData.utilizacao_cosmeticos && (
                  <input
                    type="text"
                    name="utilizacao_cosmeticos_qual"
                    value={formData.utilizacao_cosmeticos_qual}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Qual?"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="exposicao_sol"
                name="exposicao_sol"
                checked={formData.exposicao_sol}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="exposicao_sol" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Exposição ao sol
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="filtro_solar"
                name="filtro_solar"
                checked={formData.filtro_solar}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="filtro_solar" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Filtro solar
                </label>
                {formData.filtro_solar && (
                  <input
                    type="text"
                    name="filtro_solar_frequencia"
                    value={formData.filtro_solar_frequencia}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Frequência"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="tabagismo"
                name="tabagismo"
                checked={formData.tabagismo}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="tabagismo" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Tabagismo
                </label>
                {formData.tabagismo && (
                  <input
                    type="text"
                    name="tabagismo_quantidade"
                    value={formData.tabagismo_quantidade}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Quantidade/dia"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="ingere_bebida_alcoolica"
                name="ingere_bebida_alcoolica"
                checked={formData.ingere_bebida_alcoolica}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="ingere_bebida_alcoolica" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Ingere bebida alcoólica
                </label>
                {formData.ingere_bebida_alcoolica && (
                  <input
                    type="text"
                    name="ingere_bebida_alcoolica_frequencia"
                    value={formData.ingere_bebida_alcoolica_frequencia}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Frequência"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Funcionamento intestinal</label>
              <input
                type="text"
                name="funcionamento_intestinal"
                value={formData.funcionamento_intestinal}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Qualidade do sono</label>
              <select
                name="qualidade_sono"
                value={formData.qualidade_sono}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              >
                <option value="">Selecione</option>
                <option value="Boa">Boa</option>
                <option value="Regular">Regular</option>
                <option value="Péssima">Péssima</option>
              </select>
              {formData.qualidade_sono && (
                <input
                  type="text"
                  name="qualidade_sono_horas"
                  value={formData.qualidade_sono_horas}
                  onChange={handleInputChange}
                  className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Horas/noite"
                />
              )}
            </div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="tempo_pe_sentada"
                name="tempo_pe_sentada"
                checked={formData.tempo_pe_sentada}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="tempo_pe_sentada" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Tempo em pé/sentada
                </label>
                {formData.tempo_pe_sentada && (
                  <input
                    type="text"
                    name="tempo_pe_sentada_tempo"
                    value={formData.tempo_pe_sentada_tempo}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Tempo"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ingestão de água (copos/dia)</label>
              <input
                type="text"
                name="ingestao_agua"
                value={formData.ingestao_agua}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de alimentação</label>
              <input
                type="text"
                name="tipo_alimentacao"
                value={formData.tipo_alimentacao}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alimentos de preferência</label>
              <input
                type="text"
                name="alimentos_preferencia"
                value={formData.alimentos_preferencia}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="pratica_atividade_fisica"
                name="pratica_atividade_fisica"
                checked={formData.pratica_atividade_fisica}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="pratica_atividade_fisica" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Prática de atividade física
                </label>
                {formData.pratica_atividade_fisica && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      name="pratica_atividade_fisica_tipo"
                      value={formData.pratica_atividade_fisica_tipo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder="Tipo"
                    />
                    <input
                      type="text"
                      name="pratica_atividade_fisica_frequencia"
                      value={formData.pratica_atividade_fisica_frequencia}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder="Frequência"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="uso_anticoncepcional"
                name="uso_anticoncepcional"
                checked={formData.uso_anticoncepcional}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="uso_anticoncepcional" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Uso de anticoncepcional
                </label>
                {formData.uso_anticoncepcional && (
                  <input
                    type="text"
                    name="uso_anticoncepcional_qual"
                    value={formData.uso_anticoncepcional_qual}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Qual?"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data da última menstruação</label>
              <input
                type="date"
                name="data_ultima_menstruacao"
                value={formData.data_ultima_menstruacao}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="gestante"
                name="gestante"
                checked={formData.gestante}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="gestante" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Gestante
              </label>
            </div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="gestacoes"
                name="gestacoes"
                checked={formData.gestacoes}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="gestacoes" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Gestações
                </label>
                {formData.gestacoes && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      name="gestacoes_quantidade"
                      value={formData.gestacoes_quantidade}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder="Quantidade"
                    />
                    <input
                      type="text"
                      name="gestacoes_tempo"
                      value={formData.gestacoes_tempo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder="Tempo"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico Clínico */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Histórico Clínico
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Histórico Clínico</label>
            <textarea
              name="historico_clinico"
              value={formData.historico_clinico}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="tratamento_medico_atual"
                name="tratamento_medico_atual"
                checked={formData.tratamento_medico_atual}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="tratamento_medico_atual" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Tratamento médico atual
                </label>
                {formData.tratamento_medico_atual && (
                  <input
                    type="text"
                    name="tratamento_medico_atual_medicamentos"
                    value={formData.tratamento_medico_atual_medicamentos}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Medicamentos"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="uso_anticoagulantes"
                name="uso_anticoagulantes"
                checked={formData.uso_anticoagulantes}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="uso_anticoagulantes" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Uso de anticoagulantes
                </label>
                {formData.uso_anticoagulantes && (
                  <input
                    type="text"
                    name="uso_anticoagulantes_quais"
                    value={formData.uso_anticoagulantes_quais}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Quais?"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="alergias"
                name="alergias"
                checked={formData.alergias}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="alergias" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Alergias
                </label>
                {formData.alergias && (
                  <input
                    type="text"
                    name="alergias_quais"
                    value={formData.alergias_quais}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Quais?"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="reacao_anestesicos"
                name="reacao_anestesicos"
                checked={formData.reacao_anestesicos}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="reacao_anestesicos" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Reação a anestésicos
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="marcapasso"
                name="marcapasso"
                checked={formData.marcapasso}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="marcapasso" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Marcapasso
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="alteracoes_cardiacas"
                name="alteracoes_cardiacas"
                checked={formData.alteracoes_cardiacas}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="alteracoes_cardiacas" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Alterações cardíacas
                </label>
                {formData.alteracoes_cardiacas && (
                  <input
                    type="text"
                    name="alteracoes_cardiacas_quais"
                    value={formData.alteracoes_cardiacas_quais}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Quais?"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="hipo_hipertensao"
                name="hipo_hipertensao"
                checked={formData.hipo_hipertensao}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="hipo_hipertensao" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Hipo/hipertensão
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="disturbio_circulatorio"
                name="disturbio_circulatorio"
                checked={formData.disturbio_circulatorio}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="disturbio_circulatorio" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Distúrbio circulatório
                </label>
                {formData.disturbio_circulatorio && (
                  <input
                    type="text"
                    name="disturbio_circulatorio_qual"
                    value={formData.disturbio_circulatorio_qual}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Qual?"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="disturbio_renal"
                name="disturbio_renal"
                checked={formData.disturbio_renal}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="disturbio_renal" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Distúrbio renal
                </label>
                {formData.disturbio_renal && (
                  <input
                    type="text"
                    name="disturbio_renal_qual"
                    value={formData.disturbio_renal_qual}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Qual?"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="disturbio_hormonal"
                name="disturbio_hormonal"
                checked={formData.disturbio_hormonal}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="disturbio_hormonal" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Distúrbio hormonal
                </label>
                {formData.disturbio_hormonal && (
                  <input
                    type="text"
                    name="disturbio_hormonal_qual"
                    value={formData.disturbio_hormonal_qual}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Qual?"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="disturbio_gastrointestinal"
                name="disturbio_gastrointestinal"
                checked={formData.disturbio_gastrointestinal}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="disturbio_gastrointestinal" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Distúrbio gastrointestinal
                </label>
                {formData.disturbio_gastrointestinal && (
                  <input
                    type="text"
                    name="disturbio_gastrointestinal_qual"
                    value={formData.disturbio_gastrointestinal_qual}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Qual?"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="epilepsia_convulsoes"
                name="epilepsia_convulsoes"
                checked={formData.epilepsia_convulsoes}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="epilepsia_convulsoes" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Epilepsia/convulsões
                </label>
                {formData.epilepsia_convulsoes && (
                  <input
                    type="text"
                    name="epilepsia_convulsoes_frequencia"
                    value={formData.epilepsia_convulsoes_frequencia}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Frequência"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="alteracoes_psicologicas_psiquiatricas"
                name="alteracoes_psicologicas_psiquiatricas"
                checked={formData.alteracoes_psicologicas_psiquiatricas}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="alteracoes_psicologicas_psiquiatricas" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Alterações psicológicas/psiquiátricas
                </label>
                {formData.alteracoes_psicologicas_psiquiatricas && (
                  <input
                    type="text"
                    name="alteracoes_psicologicas_psiquiatricas_quais"
                    value={formData.alteracoes_psicologicas_psiquiatricas_quais}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Quais?"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="estresse"
                name="estresse"
                checked={formData.estresse}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="estresse" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Estresse
                </label>
                {formData.estresse && (
                  <input
                    type="text"
                    name="estresse_observacoes"
                    value={formData.estresse_observacoes}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Observações"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="antecedentes_oncologicos"
                name="antecedentes_oncologicos"
                checked={formData.antecedentes_oncologicos}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="antecedentes_oncologicos" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Antecedentes oncológicos
                </label>
                {formData.antecedentes_oncologicos && (
                  <input
                    type="text"
                    name="antecedentes_oncologicos_qual"
                    value={formData.antecedentes_oncologicos_qual}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Qual?"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="diabetes"
                name="diabetes"
                checked={formData.diabetes}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="diabetes" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Diabetes
                </label>
                {formData.diabetes && (
                  <input
                    type="text"
                    name="diabetes_tipo"
                    value={formData.diabetes_tipo}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Tipo"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="doenca_autoimune"
                name="doenca_autoimune"
                checked={formData.doenca_autoimune}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="doenca_autoimune" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Doença autoimune
                </label>
                {formData.doenca_autoimune && (
                  <input
                    type="text"
                    name="doenca_autoimune_qual"
                    value={formData.doenca_autoimune_qual}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Qual?"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="soropositivo"
                name="soropositivo"
                checked={formData.soropositivo}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="soropositivo" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Soropositivo
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Outra condição não listada</label>
            <textarea
              name="outra_condicao"
              value={formData.outra_condicao}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data do último check-up</label>
            <input
              type="date"
              name="data_ultimo_checkup"
              value={formData.data_ultimo_checkup}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Tratamentos Estéticos / Cirúrgicos */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Tratamentos Estéticos / Cirúrgicos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="proteses_metalicas"
              name="proteses_metalicas"
              checked={formData.proteses_metalicas}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <div className="flex-1">
              <label htmlFor="proteses_metalicas" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Próteses metálicas
              </label>
              {formData.proteses_metalicas && (
                <input
                  type="text"
                  name="proteses_metalicas_qual"
                  value={formData.proteses_metalicas_qual}
                  onChange={handleInputChange}
                  className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Qual?"
                />
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="implante_dentario"
              name="implante_dentario"
              checked={formData.implante_dentario}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="implante_dentario" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Implante dentário
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="tratamento_dermatologico_estetico"
              name="tratamento_dermatologico_estetico"
              checked={formData.tratamento_dermatologico_estetico}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <div className="flex-1">
              <label htmlFor="tratamento_dermatologico_estetico" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Tratamento dermatológico/estético
              </label>
              {formData.tratamento_dermatologico_estetico && (
                <input
                  type="text"
                  name="tratamento_dermatologico_estetico_qual"
                  value={formData.tratamento_dermatologico_estetico_qual}
                  onChange={handleInputChange}
                  className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Qual?"
                />
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="cirurgia_plastica_estetica"
              name="cirurgia_plastica_estetica"
              checked={formData.cirurgia_plastica_estetica}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <div className="flex-1">
              <label htmlFor="cirurgia_plastica_estetica" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Cirurgia plástica estética
              </label>
              {formData.cirurgia_plastica_estetica && (
                <input
                  type="text"
                  name="cirurgia_plastica_estetica_qual"
                  value={formData.cirurgia_plastica_estetica_qual}
                  onChange={handleInputChange}
                  className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Qual?"
                />
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="cirurgia_reparadora"
              name="cirurgia_reparadora"
              checked={formData.cirurgia_reparadora}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <div className="flex-1">
              <label htmlFor="cirurgia_reparadora" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Cirurgia reparadora
              </label>
              {formData.cirurgia_reparadora && (
                <input
                  type="text"
                  name="cirurgia_reparadora_qual"
                  value={formData.cirurgia_reparadora_qual}
                  onChange={handleInputChange}
                  className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Qual?"
                />
              )}
            </div>
          </div>
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
          {saving ? 'Salvando...' : 'Salvar Avaliação Geral'}
        </button>
      </div>
    </form>
  )
}

