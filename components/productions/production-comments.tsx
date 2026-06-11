'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Send,
  Loader2,
  UserCircle2,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  getProductionApprovals,
  addTeamNote,
  type ProductionApproval,
} from '@/lib/data/production-comments'

interface ProductionCommentsProps {
  productionId: string
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isClientEntry(entry: ProductionApproval) {
  return entry.action === 'aprovado' || entry.action === 'reprovado' || entry.action === 'comentario_cliente'
}

function getActionMeta(entry: ProductionApproval) {
  switch (entry.action) {
    case 'aprovado':
      return {
        label: 'Aprovado',
        icon: CheckCircle2,
        badgeClass: 'bg-emerald-100 text-emerald-700',
        cardClass: 'bg-emerald-50 border-emerald-200',
        nameClass: 'text-emerald-800',
        iconClass: 'text-emerald-600',
        textClass: 'text-emerald-900',
      }
    case 'reprovado':
      return {
        label: 'Pediu ajuste',
        icon: AlertTriangle,
        badgeClass: 'bg-orange-200 text-orange-800',
        cardClass: 'bg-orange-50 border-orange-200',
        nameClass: 'text-orange-800',
        iconClass: 'text-orange-600',
        textClass: 'text-orange-900',
      }
    case 'comentario_cliente':
      return {
        label: 'Comentário',
        icon: MessageSquare,
        badgeClass: 'bg-blue-100 text-blue-700',
        cardClass: 'bg-blue-50 border-blue-200',
        nameClass: 'text-blue-800',
        iconClass: 'text-blue-600',
        textClass: 'text-blue-900',
      }
    default:
      return {
        label: 'Equipe',
        icon: Users,
        badgeClass: 'bg-secondary text-muted-foreground',
        cardClass: 'bg-muted/50 border-border',
        nameClass: 'text-foreground',
        iconClass: 'text-muted-foreground',
        textClass: 'text-foreground',
      }
  }
}

export function ProductionComments({ productionId }: ProductionCommentsProps) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<ProductionApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadEntries = async () => {
    setLoading(true)
    try {
      const data = await getProductionApprovals(productionId)
      setEntries(data)
    } catch (error) {
      console.error('[v0] Erro ao carregar comentários:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productionId) {
      loadEntries()
    }
  }, [productionId])

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    setIsSubmitting(true)
    try {
      await addTeamNote({
        productionId,
        comment: newComment,
        authorName: user?.name || 'Equipe',
      })
      setNewComment('')
      await loadEntries()
    } catch (error) {
      console.error('[v0] Erro ao adicionar comentário:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const adjustmentCount = entries.filter((e) => e.action === 'reprovado').length

  return (
    <div className="space-y-3 pt-4 border-t border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Comentários & Pedidos do Cliente
          </span>
        </div>
        {adjustmentCount > 0 && (
          <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px]">
            {adjustmentCount} pedido{adjustmentCount > 1 ? 's' : ''} de ajuste
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-muted/40 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum comentário ainda. Os pedidos de alteração do cliente aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry) => {
            const meta = getActionMeta(entry)
            const ActionIcon = meta.icon
            const fromClient = isClientEntry(entry)
            const authorLabel = entry.approved_by || (fromClient ? 'Cliente' : 'Equipe')
            return (
              <div
                key={entry.id}
                className={cn('rounded-lg p-3 border', meta.cardClass)}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {fromClient ? (
                      <UserCircle2 className={cn('w-4 h-4', meta.iconClass)} />
                    ) : (
                      <Users className={cn('w-4 h-4', meta.iconClass)} />
                    )}
                    <span className={cn('text-sm font-medium', meta.nameClass)}>
                      {authorLabel}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn('text-[10px] border-0 gap-1', meta.badgeClass)}
                    >
                      <ActionIcon className="w-3 h-3" />
                      {meta.label}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatDateTime(entry.created_at)}
                  </span>
                </div>
                {entry.comment ? (
                  <p className={cn('text-sm whitespace-pre-wrap', meta.textClass)}>
                    {entry.comment}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    {entry.action === 'aprovado'
                      ? 'Produção aprovada sem comentários.'
                      : 'Sem comentário.'}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-2 pt-1">
        <Textarea
          placeholder="Adicione uma anotação interna da equipe..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[72px] resize-none text-sm"
        />
        <Button
          size="sm"
          className="w-full gap-2"
          onClick={handleSubmit}
          disabled={isSubmitting || !newComment.trim()}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Adicionar anotação
        </Button>
      </div>
    </div>
  )
}
