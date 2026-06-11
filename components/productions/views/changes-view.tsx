'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Video,
  Image as ImageIcon,
  MessageSquare,
  User,
  Calendar,
  Eye,
  Check,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  notes?: string
  status: string
  type?: string
  client_name?: string
  post_date?: string
  thumbnail_url?: string | null
  thumbnail_is_video?: boolean
}

interface FeedbackEntry {
  production: ProductionInfo
  feedback: FeedbackItem[]
}

interface ChangesViewProps {
  // Abre o drawer de detalhes a partir do id da produção
  onSelectById: (productionId: string) => void
  // Atualiza o status da produção
  onUpdateStatus: (id: string, newStatus: string) => Promise<void> | void
  // Permite saber o status mais recente vindo da página
  statusOverrides?: Record<string, string>
}

const STATUS_OPTIONS = [
  'Planejamento',
  'Produção',
  'Aprovação do Cliente',
  'Solicitou Ajuste',
  'Aprovado',
  'Programado',
  'Publicado',
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Planejamento': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Produção': { bg: 'bg-violet-100', text: 'text-violet-700' },
  'Aprovação do Cliente': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Solicitou Ajuste': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Aprovado': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Programado': { bg: 'bg-slate-100', text: 'text-slate-700' },
  'Publicado': { bg: 'bg-green-100', text: 'text-green-700' },
}

function getStatusColor(status: string) {
  return STATUS_COLORS[status] || { bg: 'bg-muted', text: 'text-muted-foreground' }
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

export function ChangesView({ onSelectById, onUpdateStatus, statusOverrides }: ChangesViewProps) {
  const [entries, setEntries] = useState<FeedbackEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/productions/feedback')
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        if (cancelled) return
        setEntries(Array.isArray(data.items) ? data.items : [])
      })
      .catch(() => {
        if (!cancelled) setEntries([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleMarkDone = async (productionId: string) => {
    setUpdatingId(productionId)
    try {
      await onUpdateStatus(productionId, 'Aprovado')
      setEntries((prev) =>
        prev.map((e) =>
          e.production.id === productionId
            ? { ...e, production: { ...e.production, status: 'Aprovado' } }
            : e
        )
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const handleChangeStatus = async (productionId: string, status: string) => {
    setUpdatingId(productionId)
    try {
      await onUpdateStatus(productionId, status)
      setEntries((prev) =>
        prev.map((e) =>
          e.production.id === productionId
            ? { ...e, production: { ...e.production, status } }
            : e
        )
      )
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          Nenhuma alteração solicitada
        </h3>
        <p className="text-sm text-muted-foreground">
          Quando um cliente solicitar ajustes, eles aparecerão aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map(({ production, feedback }) => {
        const currentStatus = statusOverrides?.[production.id] || production.status
        const statusColor = getStatusColor(currentStatus)
        const isDone = currentStatus === 'Aprovado' || currentStatus === 'Publicado'
        const isUpdating = updatingId === production.id
        const isVideo = production.thumbnail_is_video

        return (
          <div
            key={production.id}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            {/* Cabeçalho da produção */}
            <div className="flex items-start gap-4 p-4 border-b border-border">
              <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                {production.thumbnail_url ? (
                  isVideo ? (
                    <video
                      src={production.thumbnail_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={production.thumbnail_url}
                      alt={production.title || 'Produção'}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : isVideo ? (
                  <Video className="w-6 h-6 text-muted-foreground/50" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground line-clamp-1">
                    {production.title || production.notes || 'Sem título'}
                  </h3>
                  <Badge
                    className={cn(
                      'font-medium border-0 flex-shrink-0',
                      statusColor.bg,
                      statusColor.text
                    )}
                  >
                    {currentStatus}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {production.client_name || 'Cliente não informado'}
                  </span>
                  {production.post_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(production.post_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-orange-600 font-medium">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {feedback.length}{' '}
                    {feedback.length === 1 ? 'alteração' : 'alterações'}
                  </span>
                </div>
              </div>
            </div>

            {/* Lista de alterações solicitadas */}
            <div className="p-4 space-y-3">
              {feedback.map((item) => (
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

              {/* Ações */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <Select
                    value={currentStatus}
                    onValueChange={(value) => handleChangeStatus(production.id, value)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status} className="text-xs">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => onSelectById(production.id)}
                  >
                    <Eye className="w-4 h-4" />
                    Ver produção
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleMarkDone(production.id)}
                    disabled={isUpdating || isDone}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {isDone ? 'Concluída' : 'Marcar como feita'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
