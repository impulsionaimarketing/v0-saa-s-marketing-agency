'use client'

import { MessageSquare, User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { ProductionComment } from '@/lib/data/production-comments'

interface ProductionCommentsProps {
  comments: ProductionComment[]
  isLoading?: boolean
}

export function ProductionComments({ comments, isLoading }: ProductionCommentsProps) {
  const clientComments = comments.filter((c) => c.is_client).length

  return (
    <div className="border-t border-border pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Pedidos e comentários do cliente
        </p>
        {clientComments > 0 && (
          <Badge className="bg-amber-500/20 text-amber-600 hover:bg-amber-500/20">
            {clientComments} {clientComments === 1 ? 'pedido' : 'pedidos'}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground py-2">Carregando comentários...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded">
          Nenhum comentário ou pedido de alteração até o momento.
        </p>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                'p-3 rounded border',
                comment.is_client
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-secondary/50 border-border'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {comment.is_client ? (
                    <User className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm font-medium text-foreground truncate">
                    {comment.author_name || 'Anônimo'}
                  </span>
                  {comment.is_client && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-500/40 text-amber-600 px-1.5 py-0"
                    >
                      Cliente
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {new Date(comment.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap break-words pl-5.5">
                {comment.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
