'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Loader2, UserCircle2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  getProductionComments,
  addTeamComment,
  type ProductionComment,
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

export function ProductionComments({ productionId }: ProductionCommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<ProductionComment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadComments = async () => {
    setLoading(true)
    try {
      const data = await getProductionComments(productionId)
      setComments(data)
    } catch (error) {
      console.error('[v0] Erro ao carregar comentários:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productionId) {
      loadComments()
    }
  }, [productionId])

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    setIsSubmitting(true)
    try {
      await addTeamComment({
        productionId,
        comment: newComment,
        authorName: user?.name || 'Equipe',
        userId: user?.id,
      })
      setNewComment('')
      await loadComments()
    } catch (error) {
      console.error('[v0] Erro ao adicionar comentário:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const clientCount = comments.filter((c) => c.is_client).length

  return (
    <div className="space-y-3 pt-4 border-t border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Comentários & Pedidos do Cliente
          </span>
        </div>
        {clientCount > 0 && (
          <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px]">
            {clientCount} do cliente
          </Badge>
        )}
      </div>

      {/* Lista de comentários */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-muted/40 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum comentário ainda. Os pedidos de alteração do cliente aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                'rounded-lg p-3 border',
                comment.is_client
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-muted/50 border-border'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  {comment.is_client ? (
                    <UserCircle2 className="w-4 h-4 text-orange-600" />
                  ) : (
                    <Users className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      'text-sm font-medium',
                      comment.is_client ? 'text-orange-800' : 'text-foreground'
                    )}
                  >
                    {comment.author_name}
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px] border-0',
                      comment.is_client
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    {comment.is_client ? 'Cliente' : 'Equipe'}
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {formatDateTime(comment.created_at)}
                </span>
              </div>
              <p
                className={cn(
                  'text-sm whitespace-pre-wrap',
                  comment.is_client ? 'text-orange-900' : 'text-foreground'
                )}
              >
                {comment.comment}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Adicionar comentário interno */}
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
