'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, Download, Trash2, FileVideo, FileImage, Eye, Loader2 } from 'lucide-react'
import { formatBytes } from '@/lib/utils'
import { toast } from 'sonner'

interface ProductionFile {
  id: string
  filename: string
  url: string
  file_size: number
  file_type: string
  uploaded_at: string
}

interface VideoUploadSectionProps {
  productionId: string
  files: ProductionFile[]
  onUpdate: () => void
}

export function VideoUploadSection({ productionId, files, onUpdate }: VideoUploadSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState<ProductionFile | null>(null)

 const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      toast.error('Por favor, selecione uma imagem ou vídeo')
      return
    }

    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Tamanho máximo: 5GB')
      return
    }

    setIsUploading(true)

    try {
      const { upload } = await import('@vercel/blob/client')
      await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload-video',
        clientPayload: JSON.stringify({ productionId }),
      })

      toast.success('Arquivo enviado com sucesso!')
      onUpdate()
    } catch (error) {
      console.error('[v0] Upload error:', error)
      toast.error('Erro ao fazer upload do arquivo')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (fileId: string, url: string) => {
    if (!confirm('Deseja realmente excluir este arquivo?')) return

    startTransition(async () => {
      try {
        const response = await fetch('/api/delete-video', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId, url }),
        })

        if (!response.ok) {
          throw new Error('Erro ao excluir')
        }

        toast.success('Arquivo excluído com sucesso!')
        onUpdate()
      } catch (error) {
        console.error('[v0] Delete error:', error)
        toast.error('Erro ao excluir arquivo')
      }
    })
  }

  const isImage = (fileType: string) => fileType.startsWith('image/')
  const isVideo = (fileType: string) => fileType.startsWith('video/')

  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            Arquivos de Mídia
          </CardTitle>
          <CardDescription>
            Faça upload de imagens e vídeos finalizados (máx. 5GB por arquivo)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Button */}
          <div>
            <input
              type="file"
              id={`media-upload-${productionId}`}
              accept="image/*,video/*"
              onChange={handleUpload}
              disabled={isUploading}
              className="hidden"
            />
            <label htmlFor={`media-upload-${productionId}`}>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto cursor-pointer"
                disabled={isUploading}
                asChild
              >
                <span className="flex items-center gap-2">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Enviar Arquivo
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>

          {/* Files List */}
          {files.length > 0 ? (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-secondary/30"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {isImage(file.file_type) ? (
                      <FileImage className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <FileVideo className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{file.filename}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                        <span>{isImage(file.file_type) ? 'Imagem' : 'Vídeo'}</span>
                        <span>•</span>
                        <span>{formatBytes(file.file_size)}</span>
                        <span>•</span>
                        <span>{new Date(file.uploaded_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setPreviewFile(file)}
                    >
                      <Eye className="h-4 w-4" />
                      Visualizar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      asChild
                    >
                      <a href={file.url} download={file.filename} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(file.id, file.url)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              Nenhum arquivo enviado ainda
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base truncate pr-8">
              {previewFile?.filename}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 overflow-hidden">
            {previewFile && isImage(previewFile.file_type) && (
              <img
                src={previewFile.url}
                alt={previewFile.filename}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
            )}
            {previewFile && isVideo(previewFile.file_type) && (
              <video
                src={previewFile.url}
                controls
                className="w-full h-auto max-h-[70vh] rounded-lg"
              >
                Seu navegador não suporta a reprodução de vídeo.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
