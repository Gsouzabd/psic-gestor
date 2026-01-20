import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

interface RecurrenceActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (editAllSeries: boolean) => void
  action: 'edit' | 'delete'
  isSingle?: boolean
}

export default function RecurrenceActionModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  isSingle = false
}: RecurrenceActionModalProps) {
  const handleConfirm = (editAllSeries: boolean) => {
    onConfirm(editAllSeries)
    onClose()
  }

  const actionText = action === 'edit' ? 'editar' : 'excluir'
  const actionTextCapitalized = action === 'edit' ? 'Editar' : 'Excluir'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${actionTextCapitalized} Agendamento Recorrente`}
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              Este agendamento faz parte de uma série recorrente. Deseja {actionText} apenas esta ocorrência ou toda a série?
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleConfirm(false)}
            className="w-full px-4 py-3 text-left border-2 border-primary rounded-lg hover:bg-primary hover:bg-opacity-5 transition"
          >
            <div className="font-medium text-gray-900">
              {actionTextCapitalized} apenas esta ocorrência
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {action === 'edit'
                ? 'Apenas este agendamento será modificado e será desvinculado da recorrência.'
                : 'Apenas este agendamento será excluído. Os demais agendamentos da série continuarão ativos.'}
            </div>
          </button>

          <button
            onClick={() => handleConfirm(true)}
            className="w-full px-4 py-3 text-left border-2 border-red-300 rounded-lg hover:bg-red-50 transition"
          >
            <div className="font-medium text-gray-900">
              {actionTextCapitalized} toda a série
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {action === 'edit'
                ? 'Todos os agendamentos futuros desta série serão atualizados com as novas informações.'
                : 'Todos os agendamentos futuros desta série serão excluídos. A recorrência será cancelada.'}
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
      </div>
    </Modal>
  )
}
