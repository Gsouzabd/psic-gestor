import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { Save } from 'lucide-react'

export default function AvaliacaoFacialTab({ pacienteId, paciente }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { success, error: showError } = useToast()
  const [formData, setFormData] = useState({
    biotipo_cutaneo: '',
    estado_cutaneo: '',
    textura: '',
    espessura: '',
    ostios: '',
    acne_grau: '',
    involucao_cutanea_linhas: '',
    involucao_cutanea_sulcos: '',
    involucao_cutanea_rugas: '',
    involucao_cutanea_elastose_solar: '',
    involucao_cutanea_ptose: '',
    involucao_cutanea_ptose_local: '',
    fototipo_fitzpatrick: '',
    fotoenvelhecimento_glogau: '',
    observacoes: '',
    sistema_baumann_acromia_local: '',
    sistema_baumann_acromia_tipo: '',
    sistema_baumann_hipocromia_local: '',
    sistema_baumann_hipocromia_tipo: '',
    sistema_baumann_hipercromia_local: '',
    sistema_baumann_hipercromia_tipo: '',
    sistema_baumann_hipercromia_outros: '',
    alteracoes_vasculares_equimose: '',
    alteracoes_vasculares_petequias: '',
    alteracoes_vasculares_telangiectasias: '',
    alteracoes_vasculares_eritema: '',
    alteracoes_vasculares_nevo_rubi: '',
    alteracoes_vasculares_rosacea: '',
    alteracoes_vasculares_outros: '',
    lesoes_pele: '',
    cicatriz_hipertrofica: false,
    cicatriz_atrofica: false,
    cicatriz_queloide: false,
    cicatriz_retratil: false,
    cicatriz_hipercromica: false,
    cicatriz_hipocromica: false,
    pelos_hirsutismo: '',
    pelos_hipertricose: '',
    pelos_alopecia: '',
    pelos_foliculite: '',
    olheiras: false,
    olheiras_tipo: '',
    flacidez: false,
    objetivos_tratamento: '',
    tratamento_proposto: '',
    observacoes_finais: ''
  })

  useEffect(() => {
    fetchAvaliacao()
  }, [pacienteId])

  const fetchAvaliacao = async () => {
    try {
      const { data, error } = await supabase
        .from('avaliacao_facial')
        .select('*')
        .eq('paciente_id', pacienteId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setFormData(data)
      }
    } catch (error) {
      console.error('Erro ao buscar avaliação facial:', error)
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
        .from('avaliacao_facial')
        .upsert({
          paciente_id: pacienteId,
          ...formData
        }, {
          onConflict: 'paciente_id'
        })

      if (error) throw error

      success('Avaliação Facial salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar avaliação facial:', error)
      showError('Erro ao salvar avaliação facial. Tente novamente.')
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
      {/* Biotipo Cutâneo */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Biotipo Cutâneo
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Biotipo Cutâneo</label>
          <select
            name="biotipo_cutaneo"
            value={formData.biotipo_cutaneo}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          >
            <option value="">Selecione</option>
            <option value="Eudérmica">Eudérmica</option>
            <option value="Lipídica">Lipídica</option>
            <option value="Alípica">Alípica</option>
            <option value="Mista">Mista</option>
          </select>
        </div>
      </div>

      {/* Estado Cutâneo */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Estado Cutâneo
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado Cutâneo</label>
          <select
            name="estado_cutaneo"
            value={formData.estado_cutaneo}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          >
            <option value="">Selecione</option>
            <option value="Hidratado">Hidratado</option>
            <option value="Desidratado">Desidratado</option>
            <option value="Sensibilizado">Sensibilizado</option>
            <option value="Acneico">Acneico</option>
            <option value="Seborreico">Seborreico</option>
          </select>
        </div>
      </div>

      {/* Textura e Espessura */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Textura e Espessura
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Textura</label>
            <select
              name="textura"
              value={formData.textura}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            >
              <option value="">Selecione</option>
              <option value="Lisa">Lisa</option>
              <option value="Áspera">Áspera</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Espessura</label>
            <select
              name="espessura"
              value={formData.espessura}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            >
              <option value="">Selecione</option>
              <option value="Fina">Fina</option>
              <option value="Espessa">Espessa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Óstios */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Óstios
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Óstios</label>
          <select
            name="ostios"
            value={formData.ostios}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          >
            <option value="">Selecione</option>
            <option value="Dilatados zona T">Dilatados zona T</option>
            <option value="Dilatados face inteira">Dilatados face inteira</option>
            <option value="Não aparentes">Não aparentes</option>
          </select>
        </div>
      </div>

      {/* Acne */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Acne
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grau (I a V)</label>
          <select
            name="acne_grau"
            value={formData.acne_grau}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          >
            <option value="">Selecione</option>
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
            <option value="V">V</option>
          </select>
        </div>
      </div>

      {/* Involução Cutânea */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Involução Cutânea
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Linhas</label>
            <input
              type="text"
              name="involucao_cutanea_linhas"
              value={formData.involucao_cutanea_linhas}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sulcos</label>
            <input
              type="text"
              name="involucao_cutanea_sulcos"
              value={formData.involucao_cutanea_sulcos}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rugas</label>
            <input
              type="text"
              name="involucao_cutanea_rugas"
              value={formData.involucao_cutanea_rugas}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Elastose solar</label>
            <input
              type="text"
              name="involucao_cutanea_elastose_solar"
              value={formData.involucao_cutanea_elastose_solar}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="involucao_cutanea_ptose"
              name="involucao_cutanea_ptose"
              checked={formData.involucao_cutanea_ptose}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <div className="flex-1">
              <label htmlFor="involucao_cutanea_ptose" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Ptose
              </label>
              {formData.involucao_cutanea_ptose && (
                <input
                  type="text"
                  name="involucao_cutanea_ptose_local"
                  value={formData.involucao_cutanea_ptose_local}
                  onChange={handleInputChange}
                  className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  placeholder="Local"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fototipo e Fotoenvelhecimento */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Fototipo e Fotoenvelhecimento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fototipo Fitzpatrick</label>
            <select
              name="fototipo_fitzpatrick"
              value={formData.fototipo_fitzpatrick}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            >
              <option value="">Selecione</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
              <option value="V">V</option>
              <option value="VI">VI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fotoenvelhecimento – Glogau</label>
            <select
              name="fotoenvelhecimento_glogau"
              value={formData.fotoenvelhecimento_glogau}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            >
              <option value="">Selecione</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
            </select>
          </div>
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Observações
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
          />
        </div>
      </div>

      {/* Sistema Baumann – Manchas */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Sistema Baumann – Manchas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Acromia (local)</label>
            <input
              type="text"
              name="sistema_baumann_acromia_local"
              value={formData.sistema_baumann_acromia_local}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Acromia (tipo)</label>
            <input
              type="text"
              name="sistema_baumann_acromia_tipo"
              value={formData.sistema_baumann_acromia_tipo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hipocromia (local)</label>
            <input
              type="text"
              name="sistema_baumann_hipocromia_local"
              value={formData.sistema_baumann_hipocromia_local}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hipocromia (tipo)</label>
            <input
              type="text"
              name="sistema_baumann_hipocromia_tipo"
              value={formData.sistema_baumann_hipocromia_tipo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hipercromia (local)</label>
            <input
              type="text"
              name="sistema_baumann_hipercromia_local"
              value={formData.sistema_baumann_hipercromia_local}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hipercromia (tipo)</label>
            <input
              type="text"
              name="sistema_baumann_hipercromia_tipo"
              value={formData.sistema_baumann_hipercromia_tipo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Hipercromia (outros)</label>
            <input
              type="text"
              name="sistema_baumann_hipercromia_outros"
              value={formData.sistema_baumann_hipercromia_outros}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Equimose</label>
            <input
              type="text"
              name="alteracoes_vasculares_equimose"
              value={formData.alteracoes_vasculares_equimose}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Petéquias</label>
            <input
              type="text"
              name="alteracoes_vasculares_petequias"
              value={formData.alteracoes_vasculares_petequias}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telangiectasias</label>
            <input
              type="text"
              name="alteracoes_vasculares_telangiectasias"
              value={formData.alteracoes_vasculares_telangiectasias}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Eritema</label>
            <input
              type="text"
              name="alteracoes_vasculares_eritema"
              value={formData.alteracoes_vasculares_eritema}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nevo rubi</label>
            <input
              type="text"
              name="alteracoes_vasculares_nevo_rubi"
              value={formData.alteracoes_vasculares_nevo_rubi}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rosácea</label>
            <input
              type="text"
              name="alteracoes_vasculares_rosacea"
              value={formData.alteracoes_vasculares_rosacea}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Outros</label>
            <input
              type="text"
              name="alteracoes_vasculares_outros"
              value={formData.alteracoes_vasculares_outros}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Lesões de Pele */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Lesões de Pele
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Lesões de Pele</label>
          <textarea
            name="lesoes_pele"
            value={formData.lesoes_pele}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
            placeholder="comedões, pápula, pústula, millium, cisto, nódulo, psoríase, etc."
          />
        </div>
      </div>

      {/* Cicatriz */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Cicatriz
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="cicatriz_hipertrofica"
              name="cicatriz_hipertrofica"
              checked={formData.cicatriz_hipertrofica}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="cicatriz_hipertrofica" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Hipertrófica
            </label>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="cicatriz_atrofica"
              name="cicatriz_atrofica"
              checked={formData.cicatriz_atrofica}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="cicatriz_atrofica" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Atrófica
            </label>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="cicatriz_queloide"
              name="cicatriz_queloide"
              checked={formData.cicatriz_queloide}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="cicatriz_queloide" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Queloide
            </label>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="cicatriz_retratil"
              name="cicatriz_retratil"
              checked={formData.cicatriz_retratil}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="cicatriz_retratil" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Retrátil
            </label>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="cicatriz_hipercromica"
              name="cicatriz_hipercromica"
              checked={formData.cicatriz_hipercromica}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="cicatriz_hipercromica" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Hipercrômica
            </label>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="cicatriz_hipocromica"
              name="cicatriz_hipocromica"
              checked={formData.cicatriz_hipocromica}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="cicatriz_hipocromica" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Hipocrômica
            </label>
          </div>
        </div>
      </div>

      {/* Pelos */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Pelos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hirsutismo</label>
            <input
              type="text"
              name="pelos_hirsutismo"
              value={formData.pelos_hirsutismo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hipertricose</label>
            <input
              type="text"
              name="pelos_hipertricose"
              value={formData.pelos_hipertricose}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alopécia</label>
            <input
              type="text"
              name="pelos_alopecia"
              value={formData.pelos_alopecia}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foliculite</label>
            <input
              type="text"
              name="pelos_foliculite"
              value={formData.pelos_foliculite}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Olheiras e Flacidez */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Olheiras e Flacidez
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="olheiras"
              name="olheiras"
              checked={formData.olheiras}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <div className="flex-1">
              <label htmlFor="olheiras" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Olheiras
              </label>
              {formData.olheiras && (
                <input
                  type="text"
                  name="olheiras_tipo"
                  value={formData.olheiras_tipo}
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
              id="flacidez"
              name="flacidez"
              checked={formData.flacidez}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="flacidez" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Flacidez
            </label>
          </div>
        </div>
      </div>

      {/* Objetivos e Tratamento */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b border-gray-200">
          Objetivos e Tratamento
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Objetivos do Tratamento</label>
            <textarea
              name="objetivos_tratamento"
              value={formData.objetivos_tratamento}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tratamento Proposto</label>
            <textarea
              name="tratamento_proposto"
              value={formData.tratamento_proposto}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
            <textarea
              name="observacoes_finais"
              value={formData.observacoes_finais}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
            />
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
          {saving ? 'Salvando...' : 'Salvar Avaliação Facial'}
        </button>
      </div>
    </form>
  )
}

