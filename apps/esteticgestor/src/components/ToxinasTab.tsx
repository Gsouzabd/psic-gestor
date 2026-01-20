import { useState, useEffect } from 'react'
import { supabase, Modal, useToast } from '@gestor/core'
import { Plus, Calendar, Syringe, Trash2, Edit2, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ToxinMarkerEditor from './ToxinMarkerEditor'
import femaleImage from '../images/faciais/female.png'
import maleImage from '../images/faciais/male.png'

interface PontoMarcacao {
  id: string
  x: number
  y: number
  valor: number
  regiao?: string
  observacao?: string
}

interface SessaoToxina {
  id: string
  paciente_id: string
  prontuario_id?: string | null
  data: string
  imagem_base: string
  pontos_marcacao: PontoMarcacao[]
  total_unidades: number
  observacoes?: string | null
  created_at: string
  updated_at: string
}

interface ToxinasTabProps {
  pacienteId: string
  paciente: any
}

export default function ToxinasTab({ pacienteId, paciente }: ToxinasTabProps) {
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [sessoes, setSessoes] = useState<SessaoToxina[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingSessao, setEditingSessao] = useState<SessaoToxina | null>(null)
  const [viewingSessao, setViewingSessao] = useState<SessaoToxina | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    imagem_base: paciente?.genero?.toLowerCase() === 'masculino' || paciente?.genero?.toLowerCase() === 'male' ? 'male' : 'female',
    pontos_marcacao: [] as PontoMarcacao[],
    observacoes: ''
  })

  useEffect(() => {
    fetchSessoes()
  }, [pacienteId])

  const fetchSessoes = async () => {
    try {
      const { data, error } = await supabase
        .from('sessoes_toxinas')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('data', { ascending: false })

      if (error) throw error
      setSessoes((data || []) as SessaoToxina[])
    } catch (error) {
      console.error('Erro ao buscar sessões de toxina:', error)
      showError('Erro ao carregar sessões de toxina.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewSessao = () => {
    setEditingSessao(null)
    setFormData({
      data: format(new Date(), 'yyyy-MM-dd'),
      imagem_base: paciente?.genero?.toLowerCase() === 'masculino' || paciente?.genero?.toLowerCase() === 'male' ? 'male' : 'female',
      pontos_marcacao: [],
      observacoes: ''
    })
    setShowModal(true)
  }

  const handleEdit = (sessao: SessaoToxina) => {
    setEditingSessao(sessao)
    setViewingSessao(null)
    setFormData({
      data: sessao.data,
      imagem_base: sessao.imagem_base,
      pontos_marcacao: sessao.pontos_marcacao || [],
      observacoes: sessao.observacoes || ''
    })
    setShowModal(true)
  }

  const handleView = (sessao: SessaoToxina) => {
    setViewingSessao(sessao)
    setEditingSessao(null)
    setFormData({
      data: sessao.data,
      imagem_base: sessao.imagem_base,
      pontos_marcacao: sessao.pontos_marcacao || [],
      observacoes: sessao.observacoes || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const totalUnidades = formData.pontos_marcacao.reduce((sum, p) => sum + (p.valor || 0), 0)

      const sessaoData = {
        paciente_id: pacienteId,
        data: formData.data,
        imagem_base: formData.imagem_base,
        pontos_marcacao: formData.pontos_marcacao,
        total_unidades: totalUnidades,
        observacoes: formData.observacoes || null,
        updated_at: new Date().toISOString()
      }

      if (editingSessao) {
        // Atualizar
        const { error } = await supabase
          .from('sessoes_toxinas')
          .update(sessaoData)
          .eq('id', editingSessao.id)

        if (error) throw error
        success('Sessão de toxina atualizada com sucesso!')
      } else {
        // Criar nova
        const { error } = await supabase
          .from('sessoes_toxinas')
          .insert([sessaoData])

        if (error) throw error
        success('Sessão de toxina criada com sucesso!')
      }

      setShowModal(false)
      setEditingSessao(null)
      setViewingSessao(null)
      fetchSessoes()
    } catch (error: any) {
      console.error('Erro ao salvar sessão de toxina:', error)
      showError(error?.message || 'Erro ao salvar sessão de toxina. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (sessaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sessão de toxina?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('sessoes_toxinas')
        .delete()
        .eq('id', sessaoId)

      if (error) throw error
      success('Sessão de toxina excluída com sucesso!')
      fetchSessoes()
    } catch (error: any) {
      console.error('Erro ao deletar sessão de toxina:', error)
      showError(error?.message || 'Erro ao excluir sessão de toxina. Tente novamente.')
    }
  }

  const getImageUrl = (imagemBase: string) => {
    if (imagemBase.startsWith('http') || imagemBase.startsWith('/')) {
      return imagemBase
    }
    return imagemBase === 'male' ? maleImage : femaleImage
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Histórico de Toxinas</h3>
          <p className="text-sm text-gray-600 mt-1">
            {sessoes.length} {sessoes.length === 1 ? 'sessão registrada' : 'sessões registradas'}
          </p>
        </div>
        <button
          onClick={handleNewSessao}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Nova Sessão de Toxina
        </button>
      </div>

      {sessoes.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300">
          <Syringe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Nenhuma sessão de toxina registrada ainda</p>
          <button
            onClick={handleNewSessao}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition"
          >
            <Plus className="w-5 h-5" />
            Registrar Primeira Sessão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessoes.map((sessao) => {
            const totalPontos = sessao.pontos_marcacao?.length || 0
            return (
              <div
                key={sessao.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
              >
                <div className="relative mb-4 bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '3/4' }}>
                  <img
                    src={getImageUrl(sessao.imagem_base)}
                    alt="Imagem da sessão"
                    className="w-full h-full object-contain"
                  />
                  {/* Overlay com pontos */}
                  {sessao.pontos_marcacao && sessao.pontos_marcacao.length > 0 && (
                    <div className="absolute inset-0">
                      {sessao.pontos_marcacao.map((ponto, index) => (
                        <div
                          key={ponto.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2"
                          style={{
                            left: `${ponto.x}%`,
                            top: `${ponto.y}%`
                          }}
                        >
                          <div className="w-6 h-6 rounded-full bg-primary text-white border-2 border-white flex items-center justify-center text-xs font-bold shadow-lg">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(sessao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{totalPontos}</span> {totalPontos === 1 ? 'ponto' : 'pontos'}
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {sessao.total_unidades.toFixed(1)}U
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleView(sessao)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </button>
                    <button
                      onClick={() => handleEdit(sessao)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(sessao.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Nova/Editar/Visualizar Sessão */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingSessao(null)
          setViewingSessao(null)
        }}
        title={
          viewingSessao
            ? `Visualizar Sessão - ${format(new Date(formData.data), 'dd/MM/yyyy', { locale: ptBR })}`
            : editingSessao
            ? `Editar Sessão - ${format(new Date(formData.data), 'dd/MM/yyyy', { locale: ptBR })}`
            : 'Nova Sessão de Toxina'
        }
        size="lg"
      >
        {viewingSessao ? (
          <div className="space-y-4">
            <ToxinMarkerEditor
              imagemBase={formData.imagem_base}
              pontos={formData.pontos_marcacao}
              onPontosChange={() => {}} // Read-only
              pacienteGenero={paciente?.genero}
            />
            {formData.observacoes && (
              <div>
                <h5 className="text-sm font-semibold text-gray-900 mb-2">Observações:</h5>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                  {formData.observacoes}
                </p>
              </div>
            )}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => {
                  setShowModal(false)
                  setViewingSessao(null)
                }}
                className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data da Sessão *</label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Imagem Base</label>
              <select
                value={formData.imagem_base}
                onChange={(e) => setFormData(prev => ({ ...prev, imagem_base: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              >
                <option value="female">Feminino</option>
                <option value="male">Masculino</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Selecione o modelo base para marcação. Você pode alterar isso depois.
              </p>
            </div>

            <div>
              <ToxinMarkerEditor
                imagemBase={formData.imagem_base}
                pontos={formData.pontos_marcacao}
                onPontosChange={(pontos) => setFormData(prev => ({ ...prev, pontos_marcacao: pontos }))}
                pacienteGenero={paciente?.genero}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                placeholder="Anotações sobre a sessão de toxina..."
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setEditingSessao(null)
                  setViewingSessao(null)
                }}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Salvando...' : editingSessao ? 'Salvar Alterações' : 'Salvar Sessão'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}