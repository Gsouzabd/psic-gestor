import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, FileText, Download, Trash2, AlertCircle } from 'lucide-react'

export default function FileUpload({ pacienteId, currentFileUrl, onFileUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setError('Apenas arquivos PDF e imagens (JPG, PNG) são permitidos')
      return
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 5MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${pacienteId}_${Date.now()}.${fileExt}`
      const filePath = `contratos/${fileName}`

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('contratos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('contratos')
        .getPublicUrl(filePath)

      onFileUploaded(publicUrl)
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      setError('Erro ao fazer upload do arquivo. Tente novamente.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!currentFileUrl) return
    
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) return

    try {
      // Extrair o path do arquivo da URL
      const urlParts = currentFileUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `contratos/${fileName}`

      // Deletar do storage
      const { error } = await supabase.storage
        .from('contratos')
        .remove([filePath])

      if (error) throw error

      onFileUploaded('')
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      setError('Erro ao deletar arquivo. Tente novamente.')
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {currentFileUrl ? (
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary bg-opacity-10 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Contrato anexado</p>
                <p className="text-xs text-gray-600">Arquivo disponível para download</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={currentFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white rounded-lg transition"
                title="Baixar arquivo"
              >
                <Download className="w-5 h-5 text-gray-600" />
              </a>
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-white rounded-lg transition text-red-600"
                title="Excluir arquivo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer"
          >
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              {uploading ? 'Enviando arquivo...' : 'Clique para fazer upload do contrato'}
            </p>
            <p className="text-xs text-gray-600">
              PDF, JPG ou PNG até 5MB
            </p>
          </label>
        </div>
      )}
    </div>
  )
}


