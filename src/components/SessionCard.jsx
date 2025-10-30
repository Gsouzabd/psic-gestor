import { useState } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function SessionCard({ sessao, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-lg ${
              sessao.compareceu ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {sessao.compareceu ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(sessao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{sessao.hora?.slice(0, 5)}</span>
                </div>
              </div>
              
              {sessao.anotacoes && !expanded && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {sessao.anotacoes}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {sessao.compareceu ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Compareceu
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                Faltou
              </span>
            )}
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          {sessao.anotacoes ? (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Anotações da Sessão:</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {sessao.anotacoes}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic mb-4">Sem anotações registradas</p>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(sessao.id)
              }}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Sessão
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


