'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
} from '@/components/ui/sheet'
import { 
  Video, 
  Image as ImageIcon, 
  Calendar, 
  User, 
  FileText, 
  Link as LinkIcon,
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
  Clock,
  X,
  Pencil,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductionFormDialog } from './production-form-dialog'

interface ProductionFile {
  id: string
  filename: string
  url: string
  file_size?: number
  file_type?: string
  uploaded_at?: string
}

interface Production {
  id: string
  client_id: string
  client_name?: string
  type: 'Vídeo' | 'Arte'
  responsible_id?: string
  responsible_name?: string
  status: string
  post_date?: string
  notes?: string
  demand_id?: string
  created_at: string
  title?: string
  caption?: string
  approval_token?: string
  files?: ProductionFile[]
}

interface ProductionDetailDrawerProps {
  production: Production | null
  open: boolean
  onClose: () => void
  onUpdateStatus: (id: string, newStatus: string) => void
  onUpdated?: () => void
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Planejamento': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  'Produção': { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  'Aprovação do Cliente': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'Solicitou Ajuste': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  'Aprovado': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Programado': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  'Publicado': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
}

function getStatusColor(status: string) {
  return STATUS_COLORS[status] || { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' }
}

function formatDate(dateString?: string) {
  if (!dateString) return null
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatShortDate(dateString?: string) {
  if (!dateString) return null
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface ClientComment {
  id: string
  author_name?: string
  comment: string
  is_client?: boolean
  created_at?: string
  inserted_at?: string
}

interface ClientApproval {
  id: string
  action?: string
  comment?: string | null
  approved_by?: string
  created_at?: string
  inserted_at?: string
}

export function ProductionDetailDrawer({ production, open, onClose, onUpdateStatus, onUpdated }: ProductionDetailDrawerProps) {
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [clientComments, setClientComments] = useState<ClientComment[]>([])
  const [clientApprovals, setClientApprovals] = useState<ClientApproval[]>([])
  const [loadingFeedback, setLoadingFeedback] = useState(false)

  useEffect(() => {
    if (!open || !production?.id) {
      setClientComments([])
      setClientApprovals([])
      return
    }

    let cancelled = false
    setLoadingFeedback(true)
    fetch(`/api/productions/${production.id}/feedback`)
      .then((res) => (res.ok ? res.json() : { comments: [], approvals: [] }))
      .then((data) => {
        if (cancelled) return
        setClientComments(Array.isArray(data.comments) ? data.comments : [])
        setClientApprovals(Array.isArray(data.approvals) ? data.approvals : [])
      })
      .catch(() => {
        if (!cancelled) {
          setClientComments([])
          setClientApprovals([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingFeedback(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, production?.id])

  if (!production) return null

  const statusColor = getStatusColor(production.status)
  const firstFile = production.files?.[0]
  const thumbnailUrl = firstFile?.url || null
  const isVideo = production.type === 'Vídeo' || firstFile?.file_type?.startsWith('video/')

  // Mescla comentários do cliente e comentários de aprovações em uma lista única
  const clientFeedbackList: { id: string; author: string; comment: string; date?: string }[] = (() => {
    const items: { id: string; author: string; comment: string; date?: string }[] = []
    const seen = new Set<string>()

    const pushItem = (id: string, author: string, comment?: string | null, date?: string) => {
      const text = comment?.trim()
      if (!text) return
      const key = text.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      items.push({ id, author: author || 'Cliente', comment: text, date })
    }

    for (const c of clientComments) {
      pushItem(c.id, c.author_name || 'Cliente', c.comment, c.created_at || c.inserted_at)
    }
    for (const a of clientApprovals) {
      pushItem(a.id, a.approved_by || 'Cliente', a.comment, a.created_at || a.inserted_at)
    }

    return items
  })()

  const handleApprove = async () => {
    setIsSubmitting(true)
    await onUpdateStatus(production.id, 'Aprovado')
    setIsSubmitting(false)
  }

  const handleRequestAdjustment = async () => {
    if (!feedback.trim()) {
      alert('Por favor, descreva o ajuste necessário.')
      return
    }
    setIsSubmitting(true)
    await onUpdateStatus(production.id, 'Solicitou Ajuste')
    setFeedback('')
    setIsSubmitting(false)
  }

const copyLink = async () => {
  try {
    const res = await fetch('/api/approval/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productionId: production.id }),
    })
    const json = await res.json()
    if (json.url) {
      navigator.clipboard.writeText(json.url)
      alert('Link copiado!')
    }
} catch {
    alert('Erro ao gerar link.')
  }
}

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-lg font-semibold">Detalhes da Produção</SheetTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Media Preview */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
              {thumbnailUrl ? (
                isVideo ? (
                  <video
                    src={thumbnailUrl}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={thumbnailUrl}
                    alt={production.title || 'Produção'}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  {isVideo ? (
                    <Video className="w-12 h-12 text-muted-foreground/40" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                  )}
                  <p className="text-sm text-muted-foreground mt-2">Sem mídia disponível</p>
                </div>
              )}
              
              {/* Type badge */}
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm">
                  {isVideo ? <Video className="w-3 h-3 mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />}
                  {production.type}
                </Badge>
              </div>
            </div>

            {/* Title & Status */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                {production.title || production.notes || 'Sem título'}
              </h2>
              <Badge className={cn('px-3 py-1 font-medium border', statusColor.bg, statusColor.text, statusColor.border)}>
                {production.status}
              </Badge>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Cliente</span>
                </div>
                <p className="text-sm font-medium text-foreground pl-6">
                  {production.client_name || 'Não informado'}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Responsável</span>
                </div>
                <p className="text-sm font-medium text-foreground pl-6">
                  {production.responsible_name || 'Não informado'}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Data Prevista</span>
                </div>
                <p className="text-sm font-medium text-foreground pl-6">
                  {formatShortDate(production.post_date) || 'Não definida'}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Criado em</span>
                </div>
                <p className="text-sm font-medium text-foreground pl-6">
                  {formatShortDate(production.created_at) || '-'}
                </p>
              </div>
            </div>

            {/* Description/Caption */}
            {(production.caption || production.notes) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Legenda / Descrição</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {production.caption || production.notes}
                  </p>
                </div>
              </div>
            )}

            {/* All Files */}
            {production.files && production.files.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LinkIcon className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Arquivos ({production.files.length})</span>
                </div>
                <div className="space-y-2">
                  {production.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline bg-muted/50 rounded-lg p-3"
                    >
                      {file.file_type?.startsWith('video/') ? (
                        <Video className="w-4 h-4" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                      <span className="truncate flex-1">{file.filename}</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Alterações / Feedback do Cliente */}
            {(loadingFeedback || clientFeedbackList.length > 0) && (
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Alterações Solicitadas pelo Cliente</span>
                </div>

                {loadingFeedback ? (
                  <p className="text-sm text-muted-foreground">Carregando feedback...</p>
                ) : clientFeedbackList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma alteração solicitada.</p>
                ) : (
                  <div className="space-y-3">
                    {clientFeedbackList.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-orange-800">
                            {item.author || 'Cliente'}
                          </span>
                          {item.date && (
                            <span className="text-xs text-orange-700/70">
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
                )}
              </div>
            )}

            {/* Feedback for adjustments */}
            {production.status === 'Aprovação do Cliente' && (
              <div className="space-y-3 pt-4 border-t border-border">
                <label className="text-sm font-medium text-foreground">
                  Feedback (opcional para solicitar ajustes)
                </label>
                <Textarea
                  placeholder="Descreva os ajustes necessários..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="p-6 border-t border-border bg-background space-y-3">
          {production.status === 'Aprovação do Cliente' && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleRequestAdjustment}
                disabled={isSubmitting}
              >
                <AlertCircle className="w-4 h-4" />
                Solicitar Ajuste
              </Button>
              <Button
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleApprove}
                disabled={isSubmitting}
              >
                <Check className="w-4 h-4" />
                Aprovar
              </Button>
            </div>
          )}
          
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={copyLink}
          >
            <Copy className="w-4 h-4" />
            Copiar Link
          </Button>
        </div>
      </SheetContent>

      {/* Edit dialog reusing the production form */}
      <ProductionFormDialog
        production={production}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => {
          setEditOpen(false)
          onUpdated?.()
        }}
      />
    </Sheet>
  )
}
