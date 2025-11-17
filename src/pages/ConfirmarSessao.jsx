import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Calendar, Clock, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Função para criar Date a partir de string YYYY-MM-DD no fuso horário local
const parseLocalDate = (dateString) => {
  if (!dateString) return new Date()
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function ConfirmarSessao() {
  const { sessaoId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessao, setSessao] = useState(null)
  const [paciente, setPaciente] = useState(null)

  useEffect(() => {
    if (!sessaoId || !token) {
      setError('Link inválido. Token ou ID da sessão não fornecido.')
      setLoading(false)
      return
    }

    loadSessao()
  }, [sessaoId, token])

  const loadSessao = async () => {
    try {
      // Buscar sessão com token de validação usando RPC function (segura)
      const { data: sessaoDataArray, error: sessaoError } = await supabase.rpc('get_session_by_token', {
        p_sessao_id: sessaoId,
        p_token: token
      })

      if (sessaoError || !sessaoDataArray || sessaoDataArray.length === 0) {
        setError('Sessão não encontrada ou token inválido.')
        setLoading(false)
        return
      }

      const sessaoData = sessaoDataArray[0]

      // Verificar se já foi confirmada/cancelada pelo paciente
      if (sessaoData.confirmada_pelo_paciente === true) {
        setError('Esta sessão já foi confirmada pelo paciente anteriormente.')
        setLoading(false)
        return
      }

      // Formatar dados para o formato esperado
      setSessao({
        id: sessaoData.id,
        data: sessaoData.data,
        hora: sessaoData.hora,
        compareceu: sessaoData.compareceu,
        notification_token: sessaoData.notification_token,
        paciente_id: sessaoData.paciente_id,
        confirmada_pelo_paciente: sessaoData.confirmada_pelo_paciente,
        confirmada_em: sessaoData.confirmada_em
      })

      setPaciente({
        id: sessaoData.paciente_id,
        nome_completo: sessaoData.paciente_nome,
        telefone: sessaoData.paciente_telefone,
        psicologo_id: sessaoData.psicologo_id
      })

      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar sessão:', err)
      setError('Erro ao carregar dados da sessão.')
      setLoading(false)
    }
  }

  const handleConfirmar = async () => {
    await updateSessaoStatus(true, 'confirmacao')
  }

  const handleCancelar = async () => {
    await updateSessaoStatus(false, 'cancelamento')
  }

  const updateSessaoStatus = async (confirmada, tipoNotificacao) => {
    if (!sessao || !paciente) return

    setProcessing(true)
    setError('')

    try {
      // Atualizar confirmação do paciente (não altera compareceu)
      // Usar RPC function para atualizar confirmada_pelo_paciente e confirmada_em
      const { data: updateResult, error: updateError } = await supabase.rpc('update_patient_confirmation_by_token', {
        p_sessao_id: sessaoId,
        p_token: token,
        p_confirmada: confirmada
      })

      if (updateError || !updateResult) {
        throw new Error(updateError?.message || 'Erro ao atualizar confirmação da sessão')
      }

      // Criar notificação para psicólogo usando RPC function (segura)
      const message = confirmada
        ? `${paciente.nome_completo} confirmou a sessão de ${format(parseLocalDate(sessao.data), "dd/MM/yyyy", { locale: ptBR })} às ${sessao.hora?.slice(0, 5)}`
        : `${paciente.nome_completo} cancelou a sessão de ${format(parseLocalDate(sessao.data), "dd/MM/yyyy", { locale: ptBR })} às ${sessao.hora?.slice(0, 5)}`

      const { error: notificationError } = await supabase.rpc('create_session_notification', {
        p_sessao_id: sessaoId,
        p_type: tipoNotificacao,
        p_message: message
      })

      if (notificationError) {
        console.error('Erro ao criar notificação:', notificationError)
        // Não falhar se a notificação não for criada
      }

      setSuccess(true)
    } catch (err) {
      console.error('Erro ao atualizar sessão:', err)
      setError('Erro ao processar sua resposta. Tente novamente.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando informações da sessão...</p>
        </div>
      </div>
    )
  }

  if (error && !success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
            <h1 className="text-2xl font-bold text-gray-900">Erro</h1>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Resposta Registrada!</h1>
          <p className="text-gray-600 mb-6">
            Sua resposta foi registrada com sucesso. O psicólogo foi notificado.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Confirmar Sessão
        </h1>

        {sessao && paciente && (
          <div className="space-y-6">
            {/* Informações da Sessão */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data</p>
                  <p className="font-semibold text-gray-900">
                    {format(parseLocalDate(sessao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Horário</p>
                  <p className="font-semibold text-gray-900">{sessao.hora?.slice(0, 5)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Paciente</p>
                <p className="font-semibold text-gray-900">{paciente.nome_completo}</p>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-3">
              <button
                onClick={handleConfirmar}
                disabled={processing}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirmar Sessão
                  </>
                )}
              </button>
              <button
                onClick={handleCancelar}
                disabled={processing}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    Cancelar Sessão
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

