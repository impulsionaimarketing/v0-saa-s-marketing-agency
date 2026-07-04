'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, Download, Trash2, FileVideo, FileImage, Eye, Loader2, GripVertical } from 'lucide-react'
import { formatBytes } from '@/lib/utils'
import { toast } from 'sonner'

interface ProductionFile {
  id: string
  filename: string
  url: string
  file_size: number
  file_type: string
  uploaded_at: string
  position?: number
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
  const [orderedFiles, setOrderedFiles] = useState<ProductionFile[]>(
    [...files].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  )
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const dragIndex = useRef<number | null>(null)
  const dragOverIndex = useRef<number | null>(null)

  // Sync when files prop changes
  useState(() => {
    setOrderedFiles([...files].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)))
  })

  const uploadSingleFile = async (file: File) => {
    const { upload } = await import('@vercel/blob/client')
    const uniquePath = `productions/${productionId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`
    const blob = await upload(uniquePath, file, {
      access: 'public',
      handleUploadUrl: `/api/upload-video/token?productionId=${productionId}`,
    })

    const confirmRes = await fetch('/api/upload-video/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productionId,
        url: blob.url,
        filename: file.name,
        fileSize: file.size,
        fileType: file.type,
      }),
    })

    if (!confirmRes.ok) throw new Error('Erro ao salvar referência')
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? [])
    if (selectedFiles.length === 0) return

    const validFiles = selectedFiles.filter((file) => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/')
      if (!isValidType) { toast.error(`"${file.name}" não é uma imagem ou vídeo`); return false }
      if (file.size > 5 * 1024 * 1024 * 1024) { toast.error(`"${file.name}" é muito grande (máx. 5GB)`); return false }
      return true
    })

    if (validFiles.length === 0) { e.target.value = ''; return }

    setIsUploading(true)
    let successCount = 0, errorCount = 0

    try {
      for (const file of validFiles) {
        try { await uploadSingleFile(file); successCount++ }
        catch (error) { console.error('[v0] Upload error:', error); errorCount++ }
      }
      if (successCount > 0) {
        toast.success(successCount === 1 ? 'Arquivo enviado!' : `${successCount} arquivos enviados!`)
        onUpdate()
      }
      if (errorCount > 0) toast.error(`Erro ao enviar ${errorCount} arquivo${errorCount > 1 ? 's' : ''}`)
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
        if (!response.ok) throw new Error('Erro ao excluir')
        toast.success('Arquivo excluído!')
        onUpdate()
      } catch (error) {
        console.error('[v0] Delete error:', error)
        toast.error('Erro ao excluir arquivo')
      }
    })
  }

  const handleDragStart = (index: number) => {
    dragIndex.current = index
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragOverIndex.current = index
  }

  const handleDrop = () => {
    if (dragIndex.current === null || dragOverIndex.current === null) return
    if (dragIndex.current === dragOverIndex.current) return

    const newOrder = [...orderedFiles]
    const dragged = newOrder.splice(dragIndex.current, 1)[0]
    newOrder.splice(dragOverIndex.current, 0, dragged)
    setOrderedFiles(newOrder)
    dragIndex.current = null
    dragOverIndex.current = null
  }

  const handleSaveOrder = async () => {
    setIsSavingOrder(true)
    try {
      const res = await fetch(`/api/productions/${productionId}/reorder-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: orderedFiles.map((f) => f.id) }),
      })
      if (!res.ok) throw new Error('Erro ao salvar ordem')
      toast.success('Ordem salva!')
      onUpdate()
    } catch (error) {
      toast.error('Erro ao salvar ordem')
    } finally {
      setIsSavingOrder(false)
    }
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
            Arraste para reordenar. A ordem define o carrossel na aprovação do cliente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="file"
              id={`media-upload-${productionId}`}
              accept="image/*,video/*"
              multiple
              onChange={handleUpload}
              disabled={isUploading}
              className="hidden"
            />
            <label htmlFor={`media-upload-${productionId}`}>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                disabled={isUploading}
                asChild
              >
                <span className="flex items-center gap-2">
                  {isUploading ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</> : <><Upload className="h-4 w-4" />Enviar Arquivos</>}
                </span>
              </Button>
            </label>
            {orderedFiles.length > 1 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSaveOrder}
                disabled={isSavingOrder}
                className="gap-2"
              >
                {isSavingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salvar Ordem
              </Button>
            )}
          </div>

          {orderedFiles.length > 0 ? (
            <div className="space-y-2">
              {orderedFiles.map((file, index) => (
                <div
                  key={file.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={handleDrop}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-secondary/30 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-xs text-muted-foreground font-mono shrink-0 mt-1">
                      {index + 1}
                    </span>
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
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => setPreviewFile(file)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2" asChild>
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

      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base truncate pr-8">
              {previewFile?.filename}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 overflow-hidden">
            {previewFile && isImage(previewFile.file_type) && (
              <img src={previewFile.url} alt={previewFile.filename} className="w-full h-auto max-h-[70vh] object-contain rounded-lg" />
            )}
            {previewFile && isVideo(previewFile.file_type) && (
              <video src={previewFile.url} controls className="w-full h-auto max-h-[70vh] rounded-lg">
                Seu navegador não suporta a reprodução de vídeo.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
