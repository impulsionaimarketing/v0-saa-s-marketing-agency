'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Upload,
  X,
  Video,
  Image as ImageIcon,
  MessageSquare,
  Loader2,
  Send,
  Check,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'

interface FeedbackItem {
  id: string
  author: string
  comment: string
  date?: string
  is_client?: boolean
}

interface ProductionInfo {
  id: string
  title?: string
  status: string
  client_name?: string
  thumbnail_url?: string | null
  thumbnail_is_video?: boolean
}

interface ProductionRevisionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  production: ProductionInfo | null
  feedback: FeedbackItem[]
  // Chamado quando a revisão foi enviada para aprovação com sucesso.
  // Deve atualizar o status e avançar para a próxima produção.
  onResent: (productionId: string) => void | Promise<void>
}

function formatDate(dateString?: string) {
  if (!dateString) return null
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ProductionRevisionDialog({
  open,
  onOpenChange,
  production,
  feedback,
  onResent,
}: ProductionRevisionDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) {
      toast.error('Selecione uma imagem ou vídeo')
      return
    }
    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 5GB')
      return
    }
    setSelectedFile(file)
    setUploaded(false)
  }

  const handleUpload = async () => {
    if (!selectedFile || !production) return
    setIsUploading(true)
    try {
      const { uploadFile } = await import('@/lib/upload-client')
      const blob = await uploadFile(selectedFile, `/api/upload-video/token?productionId=${production.id}`)
      const confirmRes = await fetch('/api/upload-video/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionId: production.id,
          url: blob.url,
          filename: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
        }),
      })
      if (!confirmRes.ok) throw new Error('Erro ao salvar arquivo')
      setUploaded(true)
      toast.success('Versão corrigida enviada!')
    } catch (error) {
      console.error('[v0] Upload error:', error)
      toast.error('Erro ao enviar arquivo')
    } finally {
      setIsUploading(false)
    }
  }

  // Envia a versão corrigida para aprovação: muda o status e gera o link
  const handleResendForApproval = async () => {
    if (!production) return
    setIsSending(true)
    try {
      // 1. Atualiza o status para "Aprovação do Cliente"
      const statusRes = await fetch(`/api/productions/${production.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Aprovação do Cliente' }),
      })
      if (!statusRes.ok) throw new Error('Falha ao atualizar status')

      // 2. Gera (ou recupera) o link de aprovação e copia para a área de transferência
      try {
        const linkRes = await fetch('/api/approval/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productionId: production.id }),
        })
        const json = await linkRes.json()
        if (json.url) {
          await navigator.clipboard.writeText(json.url)
          toast.success('Enviado para aprovação. Link copiado!')
        } else {
          toast.success('Enviado para aprovação.')
        }
      } catch {
        toast.success('Enviado para aprovação.')
      }

      // 3. Avança para a próxima produção
      await onResent(production.id)
    } catch (error) {
      console.error('[v0] Resend error:', error)
      toast.error('Erro ao enviar para aprovação')
    } finally {
      setIsSending(false)
    }
  }

  if (!production) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[640px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg">
            {production.title || 'Revisar produção'}
          </DialogTitle>
          <DialogDescription>
            {production.client_name
              ? `Cliente: ${production.client_name}`
              : 'Revise as alterações e envie a versão corrigida.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Mídia atual + alterações */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-40 h-40 rounded-lg bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
              {production.thumbnail_url ? (
                production.thumbnail_is_video ? (
                  <video
                    src={production.thumbnail_url}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                  />
                ) : (
                  <img
                    src={production.thumbnail_url || '/placeholder.svg'}
                    alt={production.title || 'Produção'}
                    className="w-full h-full object-cover"
                  />
                )
              ) : production.thumbnail_is_video ? (
                <Video className="w-8 h-8 text-muted-foreground/50" />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Alterações solicitadas ({feedback.length})
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {feedback.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-orange-200 bg-orange-50 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-orange-800">
                        {item.author || 'Cliente'}
                      </span>
                      {item.date && (
                        <span className="text-[11px] text-orange-700/70">
                          {formatDate(item.date)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-orange-900 whitespace-pre-wrap">
                      {item.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upload da versão corrigida */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">
              Versão corrigida
            </span>
            {selectedFile ? (
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {uploaded ? (
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Upload className="h-4 w-4 text-primary shrink-0" />
                  )}
                  <span className="text-sm truncate">{selectedFile.name}</span>
                </div>
                {!isUploading && !uploaded && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedFile(null)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <>
                <input
                  type="file"
                  id="revision-file-upload"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="revision-file-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full cursor-pointer"
                    asChild
                  >
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Selecionar arquivo corrigido
                    </span>
                  </Button>
                </label>
              </>
            )}

            {selectedFile && !uploaded && (
              <Button
                type="button"
                className="w-full gap-2"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isUploading ? 'Enviando arquivo...' : 'Enviar versão corrigida'}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Imagens ou vídeos até 5GB. O arquivo é adicionado à produção.
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="px-6 py-4 border-t border-border bg-background flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleResendForApproval}
            disabled={isSending}
            title="Apenas reenvia para aprovação, sem novo arquivo"
          >
            <Copy className="h-4 w-4" />
            Reenviar sem novo arquivo
          </Button>
          <Button
            type="button"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleResendForApproval}
            disabled={isSending || (!!selectedFile && !uploaded)}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar para aprovação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
