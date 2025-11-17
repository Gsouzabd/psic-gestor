import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { Upload, Image as ImageIcon, X } from 'lucide-react'

export default function ImageUpload({ sessaoId, pacienteId, currentImageUrls = [], onImagesUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [previewUrls, setPreviewUrls] = useState([])
  const [uploadingIndex, setUploadingIndex] = useState(null)
  const { success, error: showError } = useToast()
  const fileInputRef = useRef(null)

  // Inicializar previewUrls com as imagens existentes
  useEffect(() => {
    if (currentImageUrls && currentImageUrls.length > 0) {
      setPreviewUrls(currentImageUrls)
    } else {
      setPreviewUrls([])
    }
  }, [currentImageUrls])

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validar tipos de arquivo (apenas imagens)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type))
    
    if (invalidFiles.length > 0) {
      showError('Apenas imagens (JPG, PNG) são permitidas')
      return
    }

    // Validar tamanho (max 5MB por imagem)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      showError('Cada imagem deve ter no máximo 5MB')
      return
    }

    setUploading(true)

    try {
      const uploadedUrls = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadingIndex(i)

        // Criar nome único para o arquivo
        const fileExt = file.name.split('.').pop()
        const fileName = `sessao_${sessaoId || 'new'}_${pacienteId}_${Date.now()}_${i}.${fileExt}`
        const filePath = fileName

        // Upload para Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('sessoes-imagens')
          .upload(filePath, file, {
            upsert: false
          })

        if (uploadError) {
          // Se o bucket não existir, tentar criar (mas isso requer permissões admin)
          if (uploadError.message?.includes('Bucket not found')) {
            showError('Bucket de imagens não encontrado. Crie o bucket "sessoes-imagens" no Supabase Storage.')
            setUploading(false)
            setUploadingIndex(null)
            return
          }
          const message = uploadError?.message || 'Erro ao fazer upload da imagem. Tente novamente.'
          showError(message)
          continue
        }

        // Obter URL pública do arquivo
        const { data: { publicUrl } } = supabase.storage
          .from('sessoes-imagens')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      // Adicionar novas URLs às existentes
      const allUrls = [...previewUrls, ...uploadedUrls]
      setPreviewUrls(allUrls)
      onImagesUploaded(allUrls)
      
      if (uploadedUrls.length > 0) {
        success(`${uploadedUrls.length} imagem(ns) enviada(s) com sucesso!`)
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      const message = error?.message || 'Erro ao fazer upload das imagens. Tente novamente.'
      showError(message)
    } finally {
      setUploading(false)
      setUploadingIndex(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = async (index, imageUrl) => {
    if (!confirm('Tem certeza que deseja remover esta imagem?')) return

    try {
      // Extrair o path do arquivo da URL
      const urlParts = imageUrl.split('/')
      let fileName = urlParts[urlParts.length - 1]
      
      // Remover query params se houver
      if (fileName.includes('?')) {
        fileName = fileName.split('?')[0]
      }
      
      const filePath = fileName

      // Deletar do storage
      const { error } = await supabase.storage
        .from('sessoes-imagens')
        .remove([filePath])

      if (error) {
        console.error('Erro ao deletar imagem do storage:', error)
        // Continuar mesmo se houver erro ao deletar do storage
      }

      // Remover da lista de previews
      const newUrls = previewUrls.filter((_, i) => i !== index)
      setPreviewUrls(newUrls)
      onImagesUploaded(newUrls)
      
      success('Imagem removida com sucesso!')
    } catch (error) {
      console.error('Erro ao remover imagem:', error)
      showError('Erro ao remover imagem. Tente novamente.')
    }
  }

  return (
    <div className="space-y-4">
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                <img
                  src={url}
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => handleRemoveImage(index, url)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                title="Remover imagem"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/jpeg,image/jpg,image/png"
          multiple
          className="hidden"
          id="image-upload"
          disabled={uploading}
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer"
        >
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">
            {uploading 
              ? `Enviando imagem${uploadingIndex !== null ? ` ${uploadingIndex + 1}...` : 's...'}` 
              : 'Clique para adicionar imagens'}
          </p>
          <p className="text-xs text-gray-600">
            JPG ou PNG até 5MB cada
          </p>
        </label>
      </div>
    </div>
  )
}

