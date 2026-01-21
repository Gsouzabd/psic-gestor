import { useState, useRef, useEffect } from 'react'
import { X, Plus, Trash2, Edit2, Save } from 'lucide-react'
import femaleImage from '../images/faciais/female.png'
import maleImage from '../images/faciais/male.png'

interface PontoMarcacao {
  id: string
  x: number // 0-100 (percentual)
  y: number // 0-100 (percentual)
  valor: number
  toxina?: string // Descrição da toxina aplicada neste ponto
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
  const [editingToxina, setEditingToxina] = useState<string>('')
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
      valor: 0,
      toxina: ''
    }

    onPontosChange([...pontos, novoPonto])
    setEditingPonto(novoPonto.id)
    setEditingValue('')
    setEditingToxina('')
  }

  const handlePontoClick = (e: React.MouseEvent, pontoId: string) => {
    e.stopPropagation()
    setSelectedPonto(pontoId)
  }

  const handlePontoDoubleClick = (e: React.MouseEvent, ponto: PontoMarcacao) => {
    e.stopPropagation()
    setEditingPonto(ponto.id)
    setEditingValue(ponto.valor.toString())
    setEditingToxina(ponto.toxina || '')
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

  const handleSaveValue = (pontoId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const valor = parseFloat(editingValue) || 0
    const updatedPontos = pontos.map(p =>
      p.id === pontoId ? { ...p, valor, toxina: editingToxina || undefined } : p
    )
    onPontosChange(updatedPontos)
    setEditingPonto(null)
    setEditingValue('')
    setEditingToxina('')
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

  // Forçar atualização da imagem quando imagemBase ou pacienteGenero mudarem
  useEffect(() => {
    if (imageRef.current) {
      // Calcular URL da imagem base
      let newUrl: string
      if (imagemBase.startsWith('http') || imagemBase.startsWith('/')) {
        newUrl = imagemBase
      } else {
        const baseImage = imagemBase === 'male' ? 'male' : 'female'
        const genero = pacienteGenero?.toLowerCase() || baseImage
        newUrl = genero === 'masculino' || genero === 'male' ? maleImage : femaleImage
      }
      // Forçar atualização usando key ou atualizando src diretamente
      if (imageRef.current.src !== newUrl) {
        imageRef.current.src = newUrl
      }
    }
  }, [imagemBase, pacienteGenero])

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
            key={`${imagemBase}-${pacienteGenero}`}
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

                {/* Valor e toxina ao passar o mouse */}
                {(ponto.valor > 0 || ponto.toxina) && (
                  <div
                    className={`absolute top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap pointer-events-none ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {ponto.toxina && <div className="font-semibold">{ponto.toxina}</div>}
                    {ponto.valor > 0 && <div>{ponto.valor}U</div>}
                  </div>
                )}

                {/* Input inline de edição */}
                {isEditing && (
                  <div
                    className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white border-2 border-primary rounded-lg p-3 shadow-lg z-20 min-w-[200px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Toxina</label>
                        <input
                          type="text"
                          value={editingToxina}
                          onChange={(e) => setEditingToxina(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSaveValue(ponto.id)
                            } else if (e.key === 'Escape') {
                              setEditingPonto(null)
                              setEditingValue('')
                              setEditingToxina('')
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          placeholder="Ex: Botox, Dysport..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Valor (U)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSaveValue(ponto.id)
                            } else if (e.key === 'Escape') {
                              setEditingPonto(null)
                              setEditingValue('')
                              setEditingToxina('')
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          placeholder="0"
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => handleSaveValue(ponto.id, e)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-primary text-white rounded text-xs hover:bg-opacity-90"
                          title="Salvar"
                        >
                          <Save className="w-3 h-3" />
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setEditingPonto(null)
                            setEditingValue('')
                            setEditingToxina('')
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                          title="Cancelar"
                        >
                          <X className="w-3 h-3" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 text-xs text-gray-600 space-y-1">
          <p>• Clique na imagem para adicionar um novo ponto</p>
          <p>• Clique duplo em um ponto para editar toxina e valor</p>
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
                    {ponto.toxina && (
                      <div className="text-sm font-semibold text-blue-700 mb-0.5">
                        {ponto.toxina}
                      </div>
                    )}
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
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setEditingPonto(ponto.id)
                      setEditingValue(ponto.valor.toString())
                      setEditingToxina(ponto.toxina || '')
                    }}
                    className="p-1.5 text-gray-600 hover:text-primary hover:bg-primary/10 rounded transition"
                    title="Editar toxina e valor"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeletePonto(ponto.id)
                    }}
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