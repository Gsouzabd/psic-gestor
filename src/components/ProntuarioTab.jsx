import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Modal from './Modal'
import SessionCard from './SessionCard'
import RecurrenceOptions from './RecurrenceOptions'
import RecurrenceActionModal from './RecurrenceActionModal'
import { generateRecurringAppointments, deleteFutureRecurringAppointments } from '../utils/recurrence'
import { Plus, AlertCircle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function ProntuarioTab({ pacienteId, paciente }) {
  const [loading, setLoading] = useState(true)
  const [sessoes, setSessoes] = useState([])
  const [showNewModal, setShowNewModal] = useState(false)
  const [editingSessao, setEditingSessao] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false)
  const [recurrenceAction, setRecurrenceAction] = useState(null) // 'edit' ou 'delete'
  const [pendingSessao, setPendingSessao] = useState(null)
  const [editAllSeries, setEditAllSeries] = useState(false)
  const [formData, setFormData] = useState({
    data: '',
    hora: '',
    compareceu: null, // null = agendado, true = compareceu, false = não compareceu
    anotacoes: '',
    valor_sessao: paciente.valor_sessao || '',
    desconto: '0',
    isRecurring: false,
    tipoRecorrencia: 'semanal',
    dataFim: '',
    criarPrevisao: false
  })

  useEffect(() => {
    fetchSessoes()
  }, [pacienteId])

  const fetchSessoes = async () => {
    try {
      const { data, error } = await supabase
        .from('prontuarios')
        .select('*, recorrencia_id')
        .eq('paciente_id', pacienteId)
        .order('data', { ascending: false })
        .order('hora', { ascending: false })

      if (error) throw error
      setSessoes(data || [])
    } catch (error) {
      console.error('Erro ao buscar sessões:', error)
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

  const handleEdit = async (sessao) => {
    try {
      // Se a sessão tem recorrência, mostrar modal de escolha
      if (sessao.recorrencia_id) {
        setPendingSessao(sessao)
        setRecurrenceAction('edit')
        setShowRecurrenceModal(true)
        return
      }

      // Buscar pagamento vinculado
      const { data: pagamento } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('prontuario_id', sessao.id)
        .single()

      setEditingSessao(sessao)
      setFormData({
        data: sessao.data,
        hora: sessao.hora || '',
        compareceu: sessao.compareceu ?? true,
        anotacoes: sessao.anotacoes || '',
        valor_sessao: pagamento?.valor_sessao || paciente.valor_sessao || '',
        desconto: pagamento?.desconto || '0',
        isRecurring: false,
        tipoRecorrencia: 'semanal',
        dataFim: '',
        criarPrevisao: false
      })
      setShowNewModal(true)
      setError('')
    } catch (error) {
      console.error('Erro ao carregar dados da sessão:', error)
      setError('Erro ao carregar dados da sessão.')
    }
  }

  const handleRecurrenceAction = async (editAllSeries) => {
    if (!pendingSessao) return

    const sessao = pendingSessao
    const action = recurrenceAction
    setPendingSessao(null)
    setRecurrenceAction(null)
    setShowRecurrenceModal(false)

    if (action === 'edit') {
      setEditAllSeries(editAllSeries)
      
      if (editAllSeries) {
        // Editar toda a série - implementar lógica futura
        // Por enquanto, apenas editar a ocorrência atual
        setError('Edição de toda a série ainda não implementada. Editando apenas esta ocorrência.')
      }
      
      // Carregar dados da sessão para edição
      try {
        const { data: pagamento } = await supabase
          .from('pagamentos')
          .select('*')
          .eq('prontuario_id', sessao.id)
          .single()

        setEditingSessao(sessao)
        setFormData({
          data: sessao.data,
          hora: sessao.hora || '',
          compareceu: sessao.compareceu ?? true,
          anotacoes: sessao.anotacoes || '',
          valor_sessao: pagamento?.valor_sessao || paciente.valor_sessao || '',
          desconto: pagamento?.desconto || '0',
          isRecurring: false,
          tipoRecorrencia: 'semanal',
          dataFim: ''
        })
        setShowNewModal(true)
        setError('')
      } catch (error) {
        console.error('Erro ao carregar dados da sessão:', error)
        setError('Erro ao carregar dados da sessão.')
      }
    } else if (action === 'delete') {
      await handleDeleteRecurrence(sessao, editAllSeries)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Garantir que a data seja enviada corretamente (formato YYYY-MM-DD)
      // O input type="date" já retorna no formato correto, mas vamos garantir
      const dataFormatada = formData.data // Já está no formato YYYY-MM-DD

      if (editingSessao) {
        if (editAllSeries && editingSessao.recorrencia_id) {
          // Editar toda a série - implementação futura
          // Por enquanto, apenas editar a ocorrência atual e remover vínculo
          setError('Edição de toda a série ainda não implementada. Editando apenas esta ocorrência e desvinculando da série.')
          
          // Remover vínculo com recorrência
          await supabase
            .from('prontuarios')
            .update({ recorrencia_id: null })
            .eq('id', editingSessao.id)
        }

        // Atualizar prontuário existente
        const updateData = {
          data: dataFormatada,
          hora: formData.hora,
          compareceu: formData.compareceu,
          anotacoes: formData.anotacoes,
          updated_at: new Date().toISOString()
        }

        // Se não for editar toda série e tiver recorrência, remover vínculo
        if (!editAllSeries && editingSessao.recorrencia_id) {
          updateData.recorrencia_id = null
        }

        const { error: prontuarioError } = await supabase
          .from('prontuarios')
          .update(updateData)
          .eq('id', editingSessao.id)

        if (prontuarioError) throw prontuarioError

        // Atualizar pagamento vinculado
        const { error: pagamentoError } = await supabase
          .from('pagamentos')
          .update({
            data: dataFormatada,
            valor_sessao: parseFloat(formData.valor_sessao) || 0,
            desconto: parseFloat(formData.desconto) || 0,
            compareceu: formData.compareceu,
            updated_at: new Date().toISOString()
          })
          .eq('prontuario_id', editingSessao.id)

        if (pagamentoError) throw pagamentoError
      } else {
        // Validar recorrência se marcada
        if (formData.isRecurring && (!formData.tipoRecorrencia || !formData.dataFim)) {
          setError('Para agendamentos recorrentes, preencha o tipo e a data final.')
          setSaving(false)
          return
        }

        const valorSessao = parseFloat(formData.valor_sessao) || 0

        if (formData.isRecurring) {
          // Criar recorrência
          const { data: recorrencia, error: recorrenciaError } = await supabase
            .from('recorrencias')
            .insert([
              {
                paciente_id: pacienteId,
                data_inicio: dataFormatada,
                hora: formData.hora,
                tipo_recorrencia: formData.tipoRecorrencia,
                data_fim: formData.dataFim,
                ativo: true
              }
            ])
            .select()
            .single()

          if (recorrenciaError) throw recorrenciaError

          // Gerar todos os agendamentos recorrentes
          const { prontuarios, errors } = await generateRecurringAppointments({
            dataInicio: dataFormatada,
            hora: formData.hora,
            tipoRecorrencia: formData.tipoRecorrencia,
            dataFim: formData.dataFim,
            pacienteId: pacienteId,
            recorrenciaId: recorrencia.id,
            valorSessao: valorSessao,
            criarPrevisao: formData.criarPrevisao || false
          })

          if (errors.length > 0) {
            console.error('Erros ao criar alguns agendamentos:', errors)
            setError(`Agendamentos criados, mas alguns erros ocorreram: ${errors.length} erro(s)`)
          }
        } else {
          // Criar novo prontuário único
          const { data: prontuario, error: prontuarioError } = await supabase
            .from('prontuarios')
            .insert([
              {
                paciente_id: pacienteId,
                data: dataFormatada,
                hora: formData.hora,
                compareceu: formData.compareceu,
                anotacoes: formData.anotacoes
              }
            ])
            .select()
            .single()

          if (prontuarioError) throw prontuarioError

          // Criar pagamento vinculado
          const { error: pagamentoError } = await supabase
            .from('pagamentos')
            .insert([
              {
                prontuario_id: prontuario.id,
                paciente_id: pacienteId,
                data: dataFormatada,
                valor_sessao: valorSessao,
                desconto: parseFloat(formData.desconto) || 0,
                compareceu: formData.compareceu,
                pago: false
              }
            ])

          if (pagamentoError) throw pagamentoError
        }
      }

      setShowNewModal(false)
      setEditingSessao(null)
      setEditAllSeries(false)
      setFormData({
        data: '',
        hora: '',
        compareceu: null,
        anotacoes: '',
        valor_sessao: paciente.valor_sessao || '',
        desconto: '0',
        isRecurring: false,
        tipoRecorrencia: 'semanal',
        dataFim: '',
        criarPrevisao: false
      })
      fetchSessoes()
    } catch (error) {
      console.error('Erro ao salvar sessão:', error)
      setError(editingSessao ? 'Erro ao atualizar sessão. Tente novamente.' : 'Erro ao criar sessão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (sessaoId) => {
    // Buscar a sessão para verificar se tem recorrência
    const sessao = sessoes.find(s => s.id === sessaoId)
    
    if (sessao?.recorrencia_id) {
      setPendingSessao(sessao)
      setRecurrenceAction('delete')
      setShowRecurrenceModal(true)
      return
    }

    // Sessão sem recorrência - deletar normalmente
    if (!confirm('Tem certeza que deseja excluir esta sessão e seu pagamento associado?')) {
      return
    }

    await deleteSingleSession(sessaoId)
  }

  const deleteSingleSession = async (sessaoId) => {
    try {
      // Deletar pagamento primeiro
      await supabase
        .from('pagamentos')
        .delete()
        .eq('prontuario_id', sessaoId)

      // Deletar prontuário
      const { error } = await supabase
        .from('prontuarios')
        .delete()
        .eq('id', sessaoId)

      if (error) throw error
      fetchSessoes()
    } catch (error) {
      console.error('Erro ao deletar sessão:', error)
      alert('Erro ao deletar sessão')
    }
  }

  const handleDeleteRecurrence = async (sessao, deleteAllSeries) => {
    if (!deleteAllSeries) {
      // Deletar apenas esta ocorrência - remover vínculo com recorrência
      if (!confirm('Tem certeza que deseja excluir esta ocorrência? Ela será desvinculada da série recorrente.')) {
        return
      }

      try {
        // Remover vínculo com recorrência antes de deletar
        await supabase
          .from('prontuarios')
          .update({ recorrencia_id: null })
          .eq('id', sessao.id)

        await deleteSingleSession(sessao.id)
      } catch (error) {
        console.error('Erro ao deletar ocorrência:', error)
        alert('Erro ao deletar ocorrência')
      }
    } else {
      // Deletar toda a série
      if (!confirm('Tem certeza que deseja excluir TODA a série de agendamentos recorrentes? Esta ação não pode ser desfeita.')) {
        return
      }

      try {
        // Deletar todos os agendamentos futuros da recorrência
        const { deleted, errors } = await deleteFutureRecurringAppointments(
          sessao.recorrencia_id,
          sessao.data // Deletar apenas agendamentos a partir desta data
        )

        if (errors.length > 0) {
          console.error('Erros ao deletar agendamentos:', errors)
          alert(`Alguns agendamentos não puderam ser deletados: ${errors.length} erro(s)`)
        }

        // Marcar recorrência como inativa
        await supabase
          .from('recorrencias')
          .update({ ativo: false })
          .eq('id', sessao.recorrencia_id)

        fetchSessoes()
      } catch (error) {
        console.error('Erro ao deletar série:', error)
        alert('Erro ao deletar série de agendamentos')
      }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Sessões Registradas</h3>
          <p className="text-sm text-gray-600 mt-1">{sessoes.length} sessões no total</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Nova Sessão
        </button>
      </div>

      {sessoes.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300">
          <p className="text-gray-600 mb-4">Nenhuma sessão registrada ainda</p>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition"
          >
            <Plus className="w-5 h-5" />
            Registrar Primeira Sessão
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessoes.map((sessao) => (
            <SessionCard
              key={sessao.id}
              sessao={sessao}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Modal Nova/Editar Sessão */}
      <Modal
        isOpen={showNewModal}
        onClose={() => {
          setShowNewModal(false)
          setEditingSessao(null)
          setFormData({
            data: '',
            hora: '',
            compareceu: null,
            anotacoes: '',
            valor_sessao: paciente.valor_sessao || '',
            desconto: '0',
            isRecurring: false,
            tipoRecorrencia: 'semanal',
            dataFim: '',
            criarPrevisao: false
          })
          setError('')
        }}
        title={editingSessao ? "Editar Sessão" : "Nova Sessão"}
        size="md"
      >
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data *
              </label>
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora *
              </label>
              <input
                type="time"
                name="hora"
                value={formData.hora}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="compareceu"
                  value="null"
                  checked={formData.compareceu === null}
                  onChange={() => setFormData(prev => ({ ...prev, compareceu: null }))}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Agendado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="compareceu"
                  value="true"
                  checked={formData.compareceu === true}
                  onChange={() => setFormData(prev => ({ ...prev, compareceu: true }))}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Compareceu</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="compareceu"
                  value="false"
                  checked={formData.compareceu === false}
                  onChange={() => setFormData(prev => ({ ...prev, compareceu: false }))}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Não compareceu</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anotações
            </label>
            <textarea
              name="anotacoes"
              value={formData.anotacoes}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
              placeholder="Registre suas observações sobre a sessão..."
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Informações de Pagamento</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor da Sessão (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="valor_sessao"
                  value={formData.valor_sessao}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desconto (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="desconto"
                  value={formData.desconto}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Valor Final:</span>
                <span className="text-lg font-semibold text-primary">
                  R$ {(parseFloat(formData.valor_sessao || 0) - parseFloat(formData.desconto || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {!editingSessao && (
            <RecurrenceOptions
              isRecurring={formData.isRecurring}
              onRecurringChange={(value) => {
                // Calcular data final padrão se não existir
                if (value && !formData.dataFim && formData.data) {
                  const defaultEndDate = new Date(formData.data)
                  defaultEndDate.setMonth(defaultEndDate.getMonth() + 3)
                  setFormData(prev => ({ 
                    ...prev, 
                    isRecurring: value,
                    dataFim: format(defaultEndDate, 'yyyy-MM-dd')
                  }))
                } else {
                  setFormData(prev => ({ ...prev, isRecurring: value }))
                }
              }}
              tipoRecorrencia={formData.tipoRecorrencia}
              onTipoRecorrenciaChange={(value) => setFormData(prev => ({ ...prev, tipoRecorrencia: value }))}
              dataFim={formData.dataFim}
              onDataFimChange={(value) => setFormData(prev => ({ ...prev, dataFim: value }))}
              dataInicio={formData.data}
              criarPrevisao={formData.criarPrevisao}
              onCriarPrevisaoChange={(value) => setFormData(prev => ({ ...prev, criarPrevisao: value }))}
            />
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowNewModal(false)
                setEditingSessao(null)
                setFormData({
                  data: '',
                  hora: '',
                  compareceu: null,
                  anotacoes: '',
                  valor_sessao: paciente.valor_sessao || '',
                  desconto: '0',
                  isRecurring: false,
                  tipoRecorrencia: 'semanal',
                  dataFim: ''
                })
                setError('')
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
              {saving ? 'Salvando...' : editingSessao ? 'Salvar Alterações' : 'Registrar Sessão'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Ação de Recorrência */}
      <RecurrenceActionModal
        isOpen={showRecurrenceModal}
        onClose={() => {
          setShowRecurrenceModal(false)
          setPendingSessao(null)
          setRecurrenceAction(null)
        }}
        onConfirm={handleRecurrenceAction}
        action={recurrenceAction || 'edit'}
      />
    </div>
  )
}


