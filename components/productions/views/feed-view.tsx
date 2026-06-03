'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Video, Image as ImageIcon, Calendar, Eye, Pencil, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  priority?: string
  script?: string
  description?: string
  reference_url?: string
  media_url?: string
  final_url?: string
}

interface FeedViewProps {
  productions: Production[]
  onSelect: (production: Production) => void
  onUpdateStatus: (id: string, newStatus: string) => void
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
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function FeedItem({ production, onSelect, onUpdateStatus }: { production: Production; onSelect: (p: Production) => void; onUpdateStatus: (id: string, status: string) => void }) {
  const [isHovered, setIsHovered] = useState(false)
  const statusColor = getStatusColor(production.status)
  
  const thumbnailUrl = production.media_url || production.final_url || null
  const isVideo = production.type === 'Vídeo'

  return (
    <div
      className="group relative aspect-square bg-muted rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-primary/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(production)}
    >
      {/* Thumbnail */}
      {thumbnailUrl ? (
        <div className="absolute inset-0">
          {isVideo ? (
            <video
              src={thumbnailUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          ) : (
            <Image
              src={thumbnailUrl}
              alt={production.title || 'Produção'}
              fill
              className="object-cover"
            />
          )}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
          {isVideo ? (
            <Video className="w-12 h-12 text-muted-foreground/40" />
          ) : (
            <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
          )}
        </div>
      )}

      {/* Type indicator */}
      <div className="absolute top-2 left-2">
        <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
          {isVideo ? (
            <Video className="w-3.5 h-3.5 text-white" />
          ) : (
            <ImageIcon className="w-3.5 h-3.5 text-white" />
          )}
        </div>
      </div>

      {/* Status badge */}
      <div className="absolute top-2 right-2">
        <Badge className={cn('text-[10px] font-medium border-0', statusColor.bg, statusColor.text)}>
          {production.status}
        </Badge>
      </div>

      {/* Bottom info - always visible */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
        <p className="text-white text-sm font-medium truncate">
          {production.title || production.notes || 'Sem título'}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-white/70 text-xs truncate">
            {production.client_name || 'Cliente'}
          </span>
          {production.post_date && (
            <>
              <span className="text-white/40">•</span>
              <span className="text-white/70 text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(production.post_date)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Hover overlay with actions */}
      <div className={cn(
        'absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center gap-2 transition-opacity duration-200',
        isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        <Button
          size="sm"
          variant="secondary"
          className="h-9 px-3 bg-white text-black hover:bg-white/90"
          onClick={(e) => { e.stopPropagation(); onSelect(production); }}
        >
          <Eye className="w-4 h-4 mr-1.5" />
          Ver
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-9 px-3 bg-white text-black hover:bg-white/90"
          onClick={(e) => { e.stopPropagation(); onSelect(production); }}
        >
          <Pencil className="w-4 h-4 mr-1.5" />
          Editar
        </Button>
        {production.status === 'Aprovação do Cliente' && (
          <Button
            size="sm"
            className="h-9 px-3 bg-emerald-500 text-white hover:bg-emerald-600"
            onClick={(e) => { e.stopPropagation(); onUpdateStatus(production.id, 'Aprovado'); }}
          >
            <Check className="w-4 h-4 mr-1.5" />
            Aprovar
          </Button>
        )}
      </div>
    </div>
  )
}

export function FeedView({ productions, onSelect, onUpdateStatus }: FeedViewProps) {
  if (productions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">Nenhum conteúdo encontrado</h3>
        <p className="text-sm text-muted-foreground">Crie sua primeira produção para começar</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {productions.map((production) => (
        <FeedItem
          key={production.id}
          production={production}
          onSelect={onSelect}
          onUpdateStatus={onUpdateStatus}
        />
      ))}
    </div>
  )
}
