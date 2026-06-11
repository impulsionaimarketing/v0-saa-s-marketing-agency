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
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface FeedbackItem {
  id: string
  author: string
  comment: string
  date?: string
  is_client?: boolean
}

interface ChangesViewProps {
  productions: Production[]
  onSelect: (production: Production) => void
}

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

export function ChangesView({ productions, onSelect }: ChangesViewProps) {
  const [feedbackByProduction, setFeedbackByProduction] = useState<Record<string, FeedbackItem[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/productions/feedback')
      .then((res) => (res.ok ? res.json() : { feedbackByProduction: {} }))
      .then((data) => {
        if (cancelled) return
        setFeedbackByProduction(data.feedbackByProduction || {})
      })
      .catch(() => {
        if (!cancelled) setFeedbackByProduction({})
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Apenas produções que possuem feedback do cliente
  const productionsWithFeedback = productions
    .map((production) => ({
      production,
      feedback: feedbackByProduction[production.id] || [],
    }))
    .filter((entry) => entry.feedback.length > 0)
    .sort((a, b) => {
      const da = a.feedback[0]?.date ? new Date(a.feedback[0].date).getTime() : 0
      const db = b.feedback[0]?.date ? new Date(b.feedback[0].date).getTime() : 0
      return db - da
    })

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (productionsWithFeedback.length === 0) {
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
      {productionsWithFeedback.map(({ production, feedback }) => {
        const statusColor = getStatusColor(production.status)
        const firstFile = production.files?.[0]
        const thumbnailUrl = firstFile?.url || null
        const isVideo =
          production.type === 'Vídeo' || firstFile?.file_type?.startsWith('video/')

        return (
          <div
            key={production.id}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            {/* Cabeçalho da produção */}
            <div className="flex items-start gap-4 p-4 border-b border-border">
              <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                {thumbnailUrl ? (
                  isVideo ? (
                    <video
                      src={thumbnailUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={thumbnailUrl}
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
                    {production.status}
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

              <div className="flex justify-end pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => onSelect(production)}
                >
                  <Eye className="w-4 h-4" />
                  Ver produção
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
