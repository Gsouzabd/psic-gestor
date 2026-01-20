import { useState } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Trash2, Edit, Repeat, Maximize2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface SessionData {
  id: string
  data: string
  hora?: string
  anotacoes?: string
  compareceu?: boolean | null
  recorrencia_id?: string | null
  imagens_urls?: string[]
}

interface SessionCardProps {
  sessao: SessionData
  onDelete?: (id: string) => void
  onEdit?: (sessao: SessionData) => void
}

// Função para criar Date a partir de string YYYY-MM-DD no fuso horário local
const parseLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date()
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function SessionCard({ sessao, onDelete, onEdit }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-lg ${
              sessao.compareceu === true
                ? 'bg-green-50'
                : sessao.compareceu === false
                ? 'bg-red-50'
                : 'bg-yellow-50'
            }`}>
              {sessao.compareceu === true ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : sessao.compareceu === false ? (
                <XCircle className="w-6 h-6 text-red-600" />
              ) : (
                <Calendar className="w-6 h-6 text-yellow-600" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{format(parseLocalDate(sessao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
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

          <div className="flex items-center gap-2 ml-4 flex-wrap">
            {sessao.recorrencia_id && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                Recorrente
              </span>
            )}
            {sessao.compareceu === true ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Compareceu
              </span>
            ) : sessao.compareceu === false ? (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                Faltou
              </span>
            ) : (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                Agendado
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

          {sessao.imagens_urls && sessao.imagens_urls.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Imagens da Sessão:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sessao.imagens_urls.map((url, index) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedImage(url)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                      <img
                        src={url}
                        alt={`Imagem ${index + 1} da sessão`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(sessao)
                }}
                className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition text-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                Editar Sessão
              </button>
            )}
            {onDelete && (
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
            )}
          </div>
        </div>
      )}

      {/* Modal de visualização ampliada da imagem */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full my-auto">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition z-10 shadow-lg"
            >
              <XCircle className="w-6 h-6 text-gray-700" />
            </button>
            <img
              src={selectedImage}
              alt="Imagem ampliada"
              className="w-full h-auto object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
