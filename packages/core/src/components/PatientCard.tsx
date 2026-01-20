import { useNavigate } from 'react-router-dom'
import { User, Phone, Mail, Calendar, Trash2 } from 'lucide-react'

export interface Patient {
  id: string
  nome_completo: string
  telefone?: string
  email?: string
  idade?: number
  valor_sessao?: number
}

interface PatientCardProps {
  patient: Patient
  onDelete?: () => void
}

export default function PatientCard({ patient, onDelete }: PatientCardProps) {
  const navigate = useNavigate()

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Previne a navegação ao clicar no botão
    if (onDelete) {
      onDelete()
    }
  }

  return (
    <div
      onClick={() => navigate(`/pacientes/${patient.id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition cursor-pointer group relative"
    >
      <button
        onClick={handleDeleteClick}
        className="absolute top-3 right-3 p-1.5 sm:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100 z-10"
        title="Excluir paciente"
      >
        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate group-hover:text-primary transition">
            {patient.nome_completo}
          </h3>

          <div className="mt-1.5 sm:mt-2 space-y-1">
            {patient.telefone && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{patient.telefone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{patient.email}</span>
              </div>
            )}
            {patient.idade && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{patient.idade} anos</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {patient.valor_sessao && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-600">Valor por sessão</span>
            <span className="text-base sm:text-lg font-semibold text-primary">
              R$ {parseFloat(String(patient.valor_sessao)).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
