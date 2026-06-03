'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Video, 
  Image as ImageIcon, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface ListViewProps {
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

const STATUS_OPTIONS = [
  'Planejamento',
  'Produção',
  'Aprovação do Cliente',
  'Solicitou Ajuste',
  'Aprovado',
  'Programado',
  'Publicado',
]

function getStatusColor(status: string) {
  return STATUS_COLORS[status] || { bg: 'bg-muted', text: 'text-muted-foreground' }
}

function formatDate(dateString?: string) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

type SortField = 'title' | 'client_name' | 'type' | 'status' | 'post_date' | 'responsible_name'
type SortDirection = 'asc' | 'desc'

export function ListView({ productions, onSelect, onUpdateStatus }: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>('post_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedProductions = [...productions].sort((a, b) => {
    let aValue = a[sortField] || ''
    let bValue = b[sortField] || ''
    
    if (sortField === 'post_date') {
      aValue = a.post_date ? new Date(a.post_date).getTime().toString() : '0'
      bValue = b.post_date ? new Date(b.post_date).getTime().toString() : '0'
    }
    
    const comparison = aValue.toString().localeCompare(bValue.toString())
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5" />
      : <ArrowDown className="w-3.5 h-3.5" />
  }

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
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border">
            <TableHead className="w-[60px]"></TableHead>
            <TableHead>
              <button 
                onClick={() => handleSort('title')}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                Título
                <SortIcon field="title" />
              </button>
            </TableHead>
            <TableHead>
              <button 
                onClick={() => handleSort('client_name')}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                Cliente
                <SortIcon field="client_name" />
              </button>
            </TableHead>
            <TableHead>
              <button 
                onClick={() => handleSort('type')}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                Tipo
                <SortIcon field="type" />
              </button>
            </TableHead>
            <TableHead>
              <button 
                onClick={() => handleSort('responsible_name')}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                Responsável
                <SortIcon field="responsible_name" />
              </button>
            </TableHead>
            <TableHead>
              <button 
                onClick={() => handleSort('status')}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                Status
                <SortIcon field="status" />
              </button>
            </TableHead>
            <TableHead>
              <button 
                onClick={() => handleSort('post_date')}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                Data
                <SortIcon field="post_date" />
              </button>
            </TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProductions.map((production) => {
            const statusColor = getStatusColor(production.status)
            const firstFile = production.files?.[0]
            const thumbnailUrl = firstFile?.url || null
            const isVideo = production.type === 'Vídeo' || firstFile?.file_type?.startsWith('video/')

            return (
              <TableRow 
                key={production.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onSelect(production)}
              >
                {/* Thumbnail */}
                <TableCell className="p-2">
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
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
                      isVideo ? (
                        <Video className="w-5 h-5 text-muted-foreground/50" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                      )
                    )}
                  </div>
                </TableCell>

                {/* Title */}
                <TableCell>
                  <p className="font-medium text-foreground line-clamp-1">
                    {production.title || production.notes || 'Sem título'}
                  </p>
                </TableCell>

                {/* Client */}
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {production.client_name || '-'}
                  </span>
                </TableCell>

                {/* Type */}
                <TableCell>
                  <Badge variant="outline" className="gap-1 font-normal">
                    {isVideo ? (
                      <Video className="w-3 h-3" />
                    ) : (
                      <ImageIcon className="w-3 h-3" />
                    )}
                    {production.type}
                  </Badge>
                </TableCell>

                {/* Responsible */}
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {production.responsible_name || '-'}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge className={cn('font-medium border-0', statusColor.bg, statusColor.text)}>
                    {production.status}
                  </Badge>
                </TableCell>

                {/* Date */}
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(production.post_date)}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(production); }}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver detalhes
                      </DropdownMenuItem>
                      {STATUS_OPTIONS.filter(s => s !== production.status).slice(0, 3).map((status) => (
                        <DropdownMenuItem 
                          key={status}
                          onClick={(e) => { e.stopPropagation(); onUpdateStatus(production.id, status); }}
                        >
                          Mover para {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
