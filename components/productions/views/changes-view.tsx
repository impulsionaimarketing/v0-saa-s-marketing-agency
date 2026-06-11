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
  Pencil,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductionRevisionDialog } from '../production-revision-dialog'

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

interface FeedbackEntry {
  production: ProductionInfo
  feedback: FeedbackItem[]
}

interface ChangesViewProps {
  // Abre o drawer de detalhes a partir do id da produção
  onSelectById?: (productionId: string) => void
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

export function ChangesView({ onSelectById }: ChangesViewProps) {
  const [entries, setEntries] = useState<FeedbackEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

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

  // Após reenviar uma produção para aprovação, ela sai da lista (mudou de status).
  // Removemos do estado local e avançamos para a próxima.
  const handleResent = (productionId: string) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.production.id === productionId)
      const next = prev.filter((e) => e.production.id !== productionId)

      // Decide qual será a próxima produção aberta
      if (next.length === 0) {
        setActiveIndex(null)
      } else if (idx >= 0) {
        // Mantém o mesmo índice (que agora aponta para a próxima), com clamp
        setActiveIndex(Math.min(idx, next.length - 1))
      }
      return next
    })
  }

  const activeEntry = activeIndex !== null ? entries[activeIndex] : null

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
          Nenhuma alteração pendente
        </h3>
        <p className="text-sm text-muted-foreground">
          Quando um cliente solicitar ajustes, eles aparecerão aqui para você
          corrigir e reenviar.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {entries.map((entry, index) => {
          const { production, feedback } = entry
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
                        src={production.thumbnail_url || '/placeholder.svg'}
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
                      {production.title || 'Sem título'}
                    </h3>
                    <Badge className="font-medium border-0 flex-shrink-0 bg-orange-100 text-orange-700">
                      {production.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {production.client_name || 'Cliente não informado'}
                    </span>
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
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  {onSelectById && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => onSelectById(production.id)}
                    >
                      Ver detalhes
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => setActiveIndex(index)}
                  >
                    <Pencil className="w-4 h-4" />
                    Corrigir e reenviar
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <ProductionRevisionDialog
        open={activeEntry !== null}
        onOpenChange={(open) => {
          if (!open) setActiveIndex(null)
        }}
        production={activeEntry?.production || null}
        feedback={activeEntry?.feedback || []}
        onResent={handleResent}
      />
    </>
  )
}
