import { useState, useRef, useEffect } from 'react'
import { X, Plus, Trash2, Edit2, Save } from 'lucide-react'
import femaleImage from '../images/faciais/female.png'
import maleImage from '../images/faciais/male.png'

interface PontoMarcacao {
  id: string
  x: number // 0-100 (percentual)
  y: number // 0-100 (percentual)
  valor: number
  regiao?: string
  observacao?: string
}

interface ToxinMarkerEditorProps {
  imagemBase: string // 'female', 'male' ou URL
  pontos: PontoMarcacao[]
  onPontosChange: (pontos: PontoMarcacao[]) => void
  pacienteGenero?: string
}

export default function ToxinMarkerEditor({
  imagemBase,
  pontos,
  onPontosChange,
  pacienteGenero
}: ToxinMarkerEditorProps) {
  const [selectedPonto, setSelectedPonto] = useState<string | null>(null)
  const [editingPonto, setEditingPonto] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Determinar URL da imagem base
  const getImageUrl = () => {
    if (imagemBase.startsWith('http') || imagemBase.startsWith('/')) {
      return imagemBase
    }
    // Default para female se não especificado
    const baseImage = imagemBase === 'male' ? 'male' : 'female'
    // Se não tem genero definido, usar imagem base informada
    const genero = pacienteGenero?.toLowerCase() || baseImage
    return genero === 'masculino' || genero === 'male' ? maleImage : femaleImage
  }

  const calculateTotal = () => {
    return pontos.reduce((sum, p) => sum + (p.valor || 0), 0)
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isDragging) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Criar novo ponto
    const novoPonto: PontoMarcacao = {
      id: `ponto-${Date.now()}`,
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      valor: 0
    }

    onPontosChange([...pontos, novoPonto])
    setEditingPonto(novoPonto.id)
    setEditingValue('')
  }

  const handlePontoClick = (e: React.MouseEvent, pontoId: string) => {
    e.stopPropagation()
    setSelectedPonto(pontoId)
  }

  const handlePontoDoubleClick = (e: React.MouseEvent, ponto: PontoMarcacao) => {
    e.stopPropagation()
    setEditingPonto(ponto.id)
    setEditingValue(ponto.valor.toString())
  }

  const handleDragStart = (e: React.MouseEvent, ponto: PontoMarcacao) => {
    e.stopPropagation()
    setIsDragging(true)
    setSelectedPonto(ponto.id)

    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const pontoX = (ponto.x / 100) * rect.width
    const pontoY = (ponto.y / 100) * rect.height

    setDragOffset({
      x: e.clientX - pontoX,
      y: e.clientY - pontoY
    })
  }

  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging || !selectedPonto || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - dragOffset.x) / rect.width) * 100
    const y = ((e.clientY - dragOffset.y) / rect.height) * 100

    const updatedPontos = pontos.map(p =>
      p.id === selectedPonto
        ? { ...p, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
        : p
    )

    onPontosChange(updatedPontos)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleDeletePonto = (pontoId: string) => {
    if (confirm('Tem certeza que deseja remover este ponto?')) {
      onPontosChange(pontos.filter(p => p.id !== pontoId))
      setSelectedPonto(null)
      setEditingPonto(null)
    }
  }

  const handleSaveValue = (pontoId: string) => {
    const valor = parseFloat(editingValue) || 0
    const updatedPontos = pontos.map(p =>
      p.id === pontoId ? { ...p, valor } : p
    )
    onPontosChange(updatedPontos)
    setEditingPonto(null)
    setEditingValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedPonto) {
        handleDeletePonto(selectedPonto)
      }
    }
    if (e.key === 'Escape') {
      setEditingPonto(null)
      setSelectedPonto(null)
    }
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag as any)
      document.addEventListener('mouseup', handleDragEnd)
      return () => {
        document.removeEventListener('mousemove', handleDrag as any)
        document.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [isDragging, selectedPonto, dragOffset, pontos])

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Marcação de Pontos de Toxina</h4>
        <div className="text-sm text-gray-600">
          Total: <span className="font-bold text-primary text-lg">{calculateTotal().toFixed(1)}U</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div
          ref={containerRef}
          className="relative w-full bg-white rounded-lg overflow-hidden border-2 border-gray-300 cursor-crosshair"
          style={{ aspectRatio: '3/4', maxHeight: '600px' }}
          onClick={handleImageClick}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
        >
          <img
            ref={imageRef}
            src={getImageUrl()}
            alt="Rosto para marcação"
            className="w-full h-full object-contain"
            draggable={false}
          />

          {/* Pontos de marcação */}
          {pontos.map((ponto, index) => {
            const isSelected = selectedPonto === ponto.id
            const isEditing = editingPonto === ponto.id

            return (
              <div
                key={ponto.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move transition-all ${
                  isSelected ? 'z-10 scale-110' : 'z-5'
                }`}
                style={{
                  left: `${ponto.x}%`,
                  top: `${ponto.y}%`
                }}
                onClick={(e) => handlePontoClick(e, ponto.id)}
                onDoubleClick={(e) => handlePontoDoubleClick(e, ponto)}
                onMouseDown={(e) => handleDragStart(e, ponto)}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-lg transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-white scale-110'
                      : 'bg-white text-gray-900 border-primary'
                  }`}
                >
                  {index + 1}
                </div>

                {/* Valor ao passar o mouse */}
                {ponto.valor > 0 && (
                  <div
                    className={`absolute top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap pointer-events-none ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {ponto.valor}U
                  </div>
                )}

                {/* Input inline de edição */}
                {isEditing && (
                  <div
                    className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white border-2 border-primary rounded-lg p-2 shadow-lg z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveValue(ponto.id)
                          } else if (e.key === 'Escape') {
                            setEditingPonto(null)
                            setEditingValue('')
                          }
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="Valor"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveValue(ponto.id)}
                        className="p-1 bg-primary text-white rounded hover:bg-opacity-90"
                        title="Salvar"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingPonto(null)
                          setEditingValue('')
                        }}
                        className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 text-xs text-gray-600 space-y-1">
          <p>• Clique na imagem para adicionar um novo ponto</p>
          <p>• Clique duplo em um ponto para editar o valor</p>
          <p>• Arraste um ponto para movê-lo</p>
          <p>• Selecione um ponto e pressione Delete para remover</p>
        </div>
      </div>

      {/* Lista de pontos */}
      {pontos.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h5 className="text-sm font-semibold text-gray-900 mb-3">Pontos de Marcação</h5>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pontos.map((ponto, index) => (
              <div
                key={ponto.id}
                className={`flex items-center justify-between p-2 rounded border ${
                  selectedPonto === ponto.id ? 'bg-primary/10 border-primary' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Posição: ({ponto.x.toFixed(1)}%, {ponto.y.toFixed(1)}%)
                    </div>
                    <div className="text-xs text-gray-600">
                      Valor: <span className="font-semibold">{ponto.valor.toFixed(1)}U</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingPonto(ponto.id)
                      setEditingValue(ponto.valor.toString())
                    }}
                    className="p-1.5 text-gray-600 hover:text-primary hover:bg-primary/10 rounded transition"
                    title="Editar valor"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePonto(ponto.id)}
                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition"
                    title="Remover ponto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}