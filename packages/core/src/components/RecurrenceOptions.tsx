interface RecurrenceOptionsProps {
  isRecurring: boolean
  onRecurringChange: (value: boolean) => void
  tipoRecorrencia: 'semanal' | 'quinzenal'
  onTipoRecorrenciaChange: (value: 'semanal' | 'quinzenal') => void
  dataFim: string
  onDataFimChange: (value: string) => void
  dataInicio: string
  criarPrevisao?: boolean
  onCriarPrevisaoChange?: (value: boolean) => void
  modalidadePagamento?: 'por_sessao' | 'unico'
  onModalidadePagamentoChange?: (value: 'por_sessao' | 'unico') => void
  dataPagamentoUnico?: string
  onDataPagamentoUnicoChange?: (value: string) => void
}

export default function RecurrenceOptions({
  isRecurring,
  onRecurringChange,
  tipoRecorrencia,
  onTipoRecorrenciaChange,
  dataFim,
  onDataFimChange,
  dataInicio,
  criarPrevisao,
  onCriarPrevisaoChange,
  modalidadePagamento,
  onModalidadePagamentoChange,
  dataPagamentoUnico,
  onDataPagamentoUnicoChange
}: RecurrenceOptionsProps) {
  // Calcular data mínima (data início + intervalo mínimo)
  const getMinDate = (): string => {
    if (!dataInicio) return ''
    const date = new Date(dataInicio)
    date.setDate(date.getDate() + 7) // Mínimo 7 dias após início
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isRecurring"
          checked={isRecurring}
          onChange={(e) => onRecurringChange(e.target.checked)}
          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
        />
        <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 cursor-pointer">
          Agendamento recorrente
        </label>
      </div>

      {isRecurring && (
        <div className="pl-6 space-y-4 border-l-2 border-primary border-opacity-20">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de recorrência *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoRecorrencia"
                  value="semanal"
                  checked={tipoRecorrencia === 'semanal'}
                  onChange={(e) => onTipoRecorrenciaChange(e.target.value as 'semanal' | 'quinzenal')}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Semanal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoRecorrencia"
                  value="quinzenal"
                  checked={tipoRecorrencia === 'quinzenal'}
                  onChange={(e) => onTipoRecorrenciaChange(e.target.value as 'semanal' | 'quinzenal')}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Quinzenal</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data final *
            </label>
            <input
              type="date"
              value={dataFim || ''}
              onChange={(e) => onDataFimChange(e.target.value)}
              min={getMinDate()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              required={isRecurring}
            />
            <p className="text-xs text-gray-500 mt-1">
              Os agendamentos serão criados até esta data
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="criarPrevisao"
              checked={criarPrevisao || false}
              onChange={(e) => onCriarPrevisaoChange && onCriarPrevisaoChange(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="criarPrevisao" className="text-sm font-medium text-gray-700 cursor-pointer">
              Criar previsão de pagamentos
            </label>
          </div>
          {criarPrevisao && (
            <div className="space-y-3 mt-3 ml-6">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="modalidadePagamento"
                    value="por_sessao"
                    checked={modalidadePagamento === 'por_sessao' || !modalidadePagamento}
                    onChange={(e) => onModalidadePagamentoChange && onModalidadePagamentoChange(e.target.value as 'por_sessao' | 'unico')}
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Por sessão</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="modalidadePagamento"
                    value="unico"
                    checked={modalidadePagamento === 'unico'}
                    onChange={(e) => onModalidadePagamentoChange && onModalidadePagamentoChange(e.target.value as 'por_sessao' | 'unico')}
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Pagamento único</span>
                </label>
              </div>
              {modalidadePagamento === 'unico' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data do pagamento único *
                  </label>
                  <input
                    type="date"
                    value={dataPagamentoUnico || ''}
                    onChange={(e) => onDataPagamentoUnicoChange && onDataPagamentoUnicoChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    required={modalidadePagamento === 'unico'}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500">
                {modalidadePagamento === 'unico' 
                  ? 'Um único pagamento será criado para todas as sessões'
                  : 'Os pagamentos serão criados automaticamente como "Pagamento previsto" na aba Pagamentos'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
