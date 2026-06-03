'use client'

import { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Video, Image as ImageIcon, Calendar, GripVertical, User } from 'lucide-react'
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

interface KanbanViewProps {
  productions: Production[]
  onSelect: (production: Production) => void
  onUpdateStatus: (id: string, newStatus: string) => void
}

const KANBAN_COLUMNS = [
  { id: 'Planejamento', label: 'Planejamento', color: 'bg-amber-500' },
  { id: 'Produção', label: 'Produção', color: 'bg-violet-500' },
  { id: 'Aprovação do Cliente', label: 'Aprovação', color: 'bg-blue-500' },
  { id: 'Solicitou Ajuste', label: 'Ajustes', color: 'bg-orange-500' },
  { id: 'Aprovado', label: 'Aprovado', color: 'bg-emerald-500' },
  { id: 'Programado', label: 'Programado', color: 'bg-slate-500' },
  { id: 'Publicado', label: 'Publicado', color: 'bg-green-500' },
]

function formatDate(dateString?: string) {
  if (!dateString) return null
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function KanbanCard({ production, onSelect, onDragStart }: { production: Production; onSelect: (p: Production) => void; onDragStart: (e: React.DragEvent, p: Production) => void }) {
  const thumbnailUrl = production.media_url || production.final_url || null
  const isVideo = production.type === 'Vídeo'

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, production)}
      onClick={() => onSelect(production)}
      className="group bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-md overflow-hidden bg-muted mb-3">
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
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isVideo ? (
              <Video className="w-8 h-8 text-muted-foreground/40" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
            )}
          </div>
        )}
        
        {/* Type badge */}
        <div className="absolute top-1.5 left-1.5">
          <div className="w-5 h-5 rounded bg-black/60 backdrop-blur-sm flex items-center justify-center">
            {isVideo ? (
              <Video className="w-3 h-3 text-white" />
            ) : (
              <ImageIcon className="w-3 h-3 text-white" />
            )}
          </div>
        </div>

        {/* Drag handle */}
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-5 h-5 rounded bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-grab">
            <GripVertical className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground line-clamp-2">
          {production.title || production.notes || 'Sem título'}
        </p>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="w-3 h-3" />
          <span className="truncate">{production.client_name || 'Cliente'}</span>
        </div>

        {production.post_date && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(production.post_date)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function KanbanColumn({ 
  column, 
  productions, 
  onSelect, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  isDragOver 
}: { 
  column: typeof KANBAN_COLUMNS[0]
  productions: Production[]
  onSelect: (p: Production) => void
  onDragStart: (e: React.DragEvent, p: Production) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, status: string) => void
  isDragOver: boolean
}) {
  return (
    <div 
      className={cn(
        'flex-shrink-0 w-72 flex flex-col rounded-xl transition-colors duration-200',
        isDragOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 mb-3">
        <div className={cn('w-2.5 h-2.5 rounded-full', column.color)} />
        <span className="text-sm font-semibold text-foreground">{column.label}</span>
        <Badge variant="secondary" className="ml-auto text-xs h-5 px-2">
          {productions.length}
        </Badge>
      </div>

      {/* Cards container */}
      <div className="flex-1 space-y-3 px-1 pb-4 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-hide">
        {productions.length === 0 ? (
          <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg">
            <p className="text-xs text-muted-foreground">Arraste itens aqui</p>
          </div>
        ) : (
          productions.map((production) => (
            <KanbanCard
              key={production.id}
              production={production}
              onSelect={onSelect}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  )
}

export function KanbanView({ productions, onSelect, onUpdateStatus }: KanbanViewProps) {
  const [draggedItem, setDraggedItem] = useState<Production | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: React.DragEvent, production: Production) => {
    setDraggedItem(production)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedItem && draggedItem.status !== newStatus) {
      onUpdateStatus(draggedItem.id, newStatus)
    }
    setDraggedItem(null)
    setDragOverColumn(null)
  }

  const handleDragEnter = (columnId: string) => {
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const getProductionsByStatus = (status: string) => {
    return productions.filter(p => p.status === status)
  }

  return (
    <div 
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
    >
      {KANBAN_COLUMNS.map((column) => (
        <div
          key={column.id}
          onDragEnter={() => handleDragEnter(column.id)}
          onDragLeave={handleDragLeave}
        >
          <KanbanColumn
            column={column}
            productions={getProductionsByStatus(column.id)}
            onSelect={onSelect}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragOver={dragOverColumn === column.id}
          />
        </div>
      ))}
    </div>
  )
}
