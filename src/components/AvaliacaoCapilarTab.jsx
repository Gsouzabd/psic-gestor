import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { Save } from 'lucide-react'

export default function AvaliacaoCapilarTab({ pacienteId, paciente }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { success, error: showError } = useToast()
  const [formData, setFormData] = useState({
    queixa_principal: '',
    problemas_saude: false,
    problemas_saude_quais: '',
    tempo_problema: '',
    evolucao: '',
    mudanca_fios: '',
    sintomas_couro_cabeludo: '',
    alergias: false,
    alergias_quais: '',
    problemas_endocrinos: false,
    problemas_endocrinos_quais: '',
    proteses_metalicas: false,
    proteses_metalicas_quais: '',
    medicamentos: false,
    medicamentos_quais: '',
    dietas: false,
    dietas_quais: '',
    cirurgias_recentes: false,
    cirurgias_recentes_quando: '',
    quimioterapia: false,
    quimioterapia_quando: '',
    pos_bariatrico: false,
    ultima_gestacao_tempo: '',
    tratamentos_antiqueda_anteriores: '',
    uso_gel_bone_chapeu_penteado_preso_escova_capacete_chapinha: '',
    frequencia_lavagem: '',
    produtos_utilizados: '',
    tipo: '',
    aspecto: '',
    comprimento: '',
    curvatura: '',
    densidade: '',
    porosidade: '',
    textura: '',
    elasticidade: '',
    cor: '',
    alteracoes: '',
    falhas: '',
    entradas: '',
    calvicie: '',
    alopecias_especificas_localizacao: '',
    alopecias_especificas_formato: '',
    alopecias_especificas_numero_lesoes: '',
    alopecias_especificas_regiao: '',
    alopecias_especificas_tamanho: '',
    implante_capilar_se_fez: false,
    implante_capilar_tipo: '',
    implante_capilar_tempo: '',
    uso_aplique: false,
    complicacoes: '',
    tratamentos_pos_implante: '',
    historico_familiar_calvicie: false,
    historico_familiar_calvicie_grau: ''
  })

  useEffect(() => {
    fetchAvaliacao()
  }, [pacienteId])

  const fetchAvaliacao = async () => {
    try {
      const { data, error } = await supabase
        .from('avaliacao_capilar')
        .select('*')
        .eq('paciente_id', pacienteId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setFormData(data)
      }
    } catch (error) {
      console.error('Erro ao buscar avaliação capilar:', error)
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
      const { error } = await supabase
        .from('avaliacao_capilar')
        .upsert({
          paciente_id: pacienteId,
          ...formData
        }, {
          onConflict: 'paciente_id'
        })

      if (error) throw error

      success('Avaliação Capilar salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar avaliação capilar:', error)
      showError('Erro ao salvar avaliação capilar. Tente novamente.')
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
      {/* Histórico de Saúde */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Histórico de Saúde
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Queixa principal</label>
            <textarea
              name="queixa_principal"
              value={formData.queixa_principal}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="problemas_saude"
                name="problemas_saude"
                checked={formData.problemas_saude}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="problemas_saude" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Problemas de saúde
                </label>
                {formData.problemas_saude && (
                  <input
                    type="text"
                    name="problemas_saude_quais"
                    value={formData.problemas_saude_quais}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Quais?"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tempo do problema</label>
              <input
                type="text"
                name="tempo_problema"
                value={formData.tempo_problema}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Evolução</label>
              <select
                name="evolucao"
                value={formData.evolucao}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              >
                <option value="">Selecione</option>
                <option value="estável">Estável</option>
                <option value="aumentando">Aumentando</option>
                <option value="diminuindo">Diminuindo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mudança nos fios</label>
              <input
                type="text"
                name="mudanca_fios"
                value={formData.mudanca_fios}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="fino/grosso/cor/quebrado/outros"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sintomas no couro cabeludo</label>
              <textarea
                name="sintomas_couro_cabeludo"
                value={formData.sintomas_couro_cabeludo}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                placeholder="dor, coceira, ardência, inflamação, crostas, caspa, oleosidade, odor, feridas"
              />
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
                id="problemas_endocrinos"
                name="problemas_endocrinos"
                checked={formData.problemas_endocrinos}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="problemas_endocrinos" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Problemas endócrinos
                </label>
                {formData.problemas_endocrinos && (
                  <input
                    type="text"
                    name="problemas_endocrinos_quais"
                    value={formData.problemas_endocrinos_quais}
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
                    name="proteses_metalicas_quais"
                    value={formData.proteses_metalicas_quais}
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
                id="medicamentos"
                name="medicamentos"
                checked={formData.medicamentos}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="medicamentos" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Medicamentos
                </label>
                {formData.medicamentos && (
                  <input
                    type="text"
                    name="medicamentos_quais"
                    value={formData.medicamentos_quais}
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
                id="dietas"
                name="dietas"
                checked={formData.dietas}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="dietas" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Dietas
                </label>
                {formData.dietas && (
                  <input
                    type="text"
                    name="dietas_quais"
                    value={formData.dietas_quais}
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
                id="cirurgias_recentes"
                name="cirurgias_recentes"
                checked={formData.cirurgias_recentes}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="cirurgias_recentes" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Cirurgias recentes
                </label>
                {formData.cirurgias_recentes && (
                  <input
                    type="text"
                    name="cirurgias_recentes_quando"
                    value={formData.cirurgias_recentes_quando}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Quando?"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="quimioterapia"
                name="quimioterapia"
                checked={formData.quimioterapia}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div className="flex-1">
                <label htmlFor="quimioterapia" className="block text-sm font-medium text-gray-700 cursor-pointer">
                  Quimioterapia
                </label>
                {formData.quimioterapia && (
                  <input
                    type="text"
                    name="quimioterapia_quando"
                    value={formData.quimioterapia_quando}
                    onChange={handleInputChange}
                    className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Quando?"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="pos_bariatrico"
                name="pos_bariatrico"
                checked={formData.pos_bariatrico}
                onChange={handleInputChange}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="pos_bariatrico" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Pós-bariátrico
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Última gestação (tempo)</label>
              <input
                type="text"
                name="ultima_gestacao_tempo"
                value={formData.ultima_gestacao_tempo}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Aspectos do Cabelo e Couro Cabeludo */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Aspectos do Cabelo e Couro Cabeludo
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tratamentos antiqueda anteriores</label>
            <textarea
              name="tratamentos_antiqueda_anteriores"
              value={formData.tratamentos_antiqueda_anteriores}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Uso de (gel, boné, chapéu, penteado preso, escova, capacete, chapinha)</label>
            <input
              type="text"
              name="uso_gel_bone_chapeu_penteado_preso_escova_capacete_chapinha"
              value={formData.uso_gel_bone_chapeu_penteado_preso_escova_capacete_chapinha}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequência de lavagem</label>
              <input
                type="text"
                name="frequencia_lavagem"
                value={formData.frequencia_lavagem}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Produtos utilizados</label>
              <input
                type="text"
                name="produtos_utilizados"
                value={formData.produtos_utilizados}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <input
                type="text"
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aspecto</label>
              <input
                type="text"
                name="aspecto"
                value={formData.aspecto}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comprimento</label>
              <input
                type="text"
                name="comprimento"
                value={formData.comprimento}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Curvatura</label>
              <input
                type="text"
                name="curvatura"
                value={formData.curvatura}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Densidade</label>
              <input
                type="text"
                name="densidade"
                value={formData.densidade}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Porosidade</label>
              <input
                type="text"
                name="porosidade"
                value={formData.porosidade}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Textura</label>
              <input
                type="text"
                name="textura"
                value={formData.textura}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Elasticidade</label>
              <input
                type="text"
                name="elasticidade"
                value={formData.elasticidade}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
              <input
                type="text"
                name="cor"
                value={formData.cor}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alterações</label>
              <input
                type="text"
                name="alteracoes"
                value={formData.alteracoes}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Falhas</label>
              <input
                type="text"
                name="falhas"
                value={formData.falhas}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entradas</label>
              <input
                type="text"
                name="entradas"
                value={formData.entradas}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Calvície</label>
              <input
                type="text"
                name="calvicie"
                value={formData.calvicie}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alopecias Específicas */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Alopecias Específicas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Localização</label>
            <input
              type="text"
              name="alopecias_especificas_localizacao"
              value={formData.alopecias_especificas_localizacao}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
            <input
              type="text"
              name="alopecias_especificas_formato"
              value={formData.alopecias_especificas_formato}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nº de lesões</label>
            <input
              type="text"
              name="alopecias_especificas_numero_lesoes"
              value={formData.alopecias_especificas_numero_lesoes}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Região</label>
            <input
              type="text"
              name="alopecias_especificas_regiao"
              value={formData.alopecias_especificas_regiao}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tamanho</label>
            <input
              type="text"
              name="alopecias_especificas_tamanho"
              value={formData.alopecias_especificas_tamanho}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Implante Capilar */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Implante Capilar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="implante_capilar_se_fez"
              name="implante_capilar_se_fez"
              checked={formData.implante_capilar_se_fez}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <div className="flex-1">
              <label htmlFor="implante_capilar_se_fez" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Se fez
              </label>
              {formData.implante_capilar_se_fez && (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    name="implante_capilar_tipo"
                    value={formData.implante_capilar_tipo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Tipo"
                  />
                  <input
                    type="text"
                    name="implante_capilar_tempo"
                    value={formData.implante_capilar_tempo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Tempo"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="uso_aplique"
              name="uso_aplique"
              checked={formData.uso_aplique}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="uso_aplique" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Uso de aplique
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Complicações</label>
            <textarea
              name="complicacoes"
              value={formData.complicacoes}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tratamentos pós-implante</label>
            <textarea
              name="tratamentos_pos_implante"
              value={formData.tratamentos_pos_implante}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
            />
          </div>
        </div>
      </div>

      {/* Histórico Familiar de Calvície */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Histórico Familiar de Calvície
        </h3>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="historico_familiar_calvicie"
            name="historico_familiar_calvicie"
            checked={formData.historico_familiar_calvicie}
            onChange={handleInputChange}
            className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <div className="flex-1">
            <label htmlFor="historico_familiar_calvicie" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Histórico familiar de calvície
            </label>
            {formData.historico_familiar_calvicie && (
              <input
                type="text"
                name="historico_familiar_calvicie_grau"
                value={formData.historico_familiar_calvicie_grau}
                onChange={handleInputChange}
                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Grau"
              />
            )}
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
          {saving ? 'Salvando...' : 'Salvar Avaliação Capilar'}
        </button>
      </div>
    </form>
  )
}

