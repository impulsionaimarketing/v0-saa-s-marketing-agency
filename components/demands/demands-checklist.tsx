'use client'

import React, { useState, useEffect, useMemo, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Search,
  Calendar,
  User,
  Loader2,
  Pencil,
  Trash2,
  ChevronDown,
  Check,
  AlertTriangle,
  Film,
  Palette,
  ExternalLink,
  Clock,
  ChevronRight,
  Flag,
} from 'lucide-react'
import { getDemands, updateDemandStatus, deleteDemand, type Demand } from '@/lib/data/demands'
import { getClients } from '@/lib/data/clients'
import { getUsers } from '@/lib/data/users'
import { getVideoScriptByDemandId, type VideoScript } from '@/lib/data/video-scripts'
import { getArteBriefByDemandId, type ArteBrief } from '@/lib/data/arte-briefs'
import { DemandFormDialog } from './demand-form-dialog'
import { DeleteDialog } from '@/components/shared/delete-dialog'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/use-auth'
import { usePersistedFilters } from '@/lib/hooks/use-persisted-filters'

type DemandStatus = Demand['status']

const priorityConfig = {
  high: { label: 'Alta', color: 'text-destructive', bg: 'bg-destructive/10' },
  medium: { label: 'Média', color: 'text-warning', bg: 'bg-warning/10' },
  low: { label: 'Baixa', color: 'text-muted-foreground', bg: 'bg-muted' },
}

const areaColors: Record<string, string> = {
  'Arte': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  'Vídeo': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  'Tráfego': 'bg-primary/10 text-primary border-primary/20',
  'Comunicação': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
}

// Generate a consistent color based on client name
function getClientColor(clientName: string): string {
  const colors = [
    'bg-primary',
    'bg-chart-2',
    'bg-chart-3',
    'bg-chart-4',
    'bg-chart-5',
    'bg-success',
  ]
  let hash = 0
  for (let i = 0; i < clientName.length; i++) {
    hash = clientName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function isOverdue(deadline: string | null, status: DemandStatus): boolean {
  if (!deadline || status === 'Publicado') return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = parseDeadline(deadline)
  return d < now
}

// Parse deadline handling both date-only strings and ISO datetime strings
function parseDeadline(deadline: string): Date {
  // If it's just a date (YYYY-MM-DD), add time to avoid timezone issues
  if (deadline.length === 10 && !deadline.includes('T')) {
    return new Date(deadline + 'T00:00:00')
  }
  // Otherwise parse as-is
  return new Date(deadline)
}

// Format deadline for display (short)
function formatDeadline(deadline: string): string {
  const date = parseDeadline(deadline)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// Format deadline for display (full)
function formatDeadlineFull(deadline: string): string {
  const date = parseDeadline(deadline)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Detail Sheet ────────────────────────────────────────────────────────────
function DemandDetailSheet({
  demand,
  open,
  onClose,
  onSuccess,
}: {
  demand: Demand | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [videoScript, setVideoScript] = useState<VideoScript | null>(null)
  const [arteBrief, setArteBrief] = useState<ArteBrief | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    if (!demand || !open) return
    setVideoScript(null)
    setArteBrief(null)

    if (demand.area === 'Vídeo') {
      setLoadingDetail(true)
      getVideoScriptByDemandId(demand.id)
        .then(setVideoScript)
        .finally(() => setLoadingDetail(false))
    } else if (demand.area === 'Arte') {
      setLoadingDetail(true)
      getArteBriefByDemandId(demand.id)
        .then(setArteBrief)
        .finally(() => setLoadingDetail(false))
    }
  }, [demand, open])

  if (!demand) return null

  const overdue = isOverdue(demand.deadline, demand.status)
  const isPublished = demand.status === 'Publicado'

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            {demand.area === 'Vídeo' ? (
              <Film className="h-5 w-5 text-chart-2 mt-0.5 shrink-0" />
            ) : demand.area === 'Arte' ? (
              <Palette className="h-5 w-5 text-chart-3 mt-0.5 shrink-0" />
            ) : null}
            <div className="flex-1 min-w-0 pr-8">
              <SheetTitle className={cn(
                "text-left leading-tight text-lg",
                isPublished && "line-through opacity-60"
              )}>
                {demand.name}
              </SheetTitle>
              <SheetDescription className="text-left mt-1">
                {demand.client_name}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="outline" className={cn('text-xs', areaColors[demand.area])}>
                  {demand.area}
                </Badge>
                <Badge 
                  variant={isPublished ? "default" : "secondary"} 
                  className={cn("text-xs", isPublished && "bg-success text-success-foreground")}
                >
                  {isPublished ? 'Concluído' : demand.status}
                </Badge>
                {overdue && (
                  <Badge variant="destructive" className="text-xs flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Atrasado
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Cliente</p>
              <p className="text-sm font-medium">{demand.client_name || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Responsável</p>
              <p className="text-sm font-medium">{demand.responsible_name || 'Não atribuído'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Prazo</p>
              <p className={cn('text-sm font-medium', overdue && 'text-destructive')}>
                {demand.deadline ? formatDeadlineFull(demand.deadline) : '—'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Prioridade</p>
              <div className="flex items-center gap-2">
                <Flag className={cn("h-3.5 w-3.5", priorityConfig[demand.priority].color)} />
                <p className="text-sm font-medium capitalize">{priorityConfig[demand.priority].label}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Criado em</p>
              <p className="text-sm font-medium">
                {new Date(demand.created_at).toLocaleString('pt-BR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Atualizado em</p>
              <p className="text-sm font-medium">
                {new Date(demand.updated_at).toLocaleString('pt-BR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
              </p>
            </div>
          </div>

          {demand.description && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Descrição</p>
              <p className="text-sm whitespace-pre-wrap bg-secondary/40 rounded-lg p-4 leading-relaxed">
                {demand.description}
              </p>
            </div>
          )}

          {/* Video Script */}
          {demand.area === 'Vídeo' && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-chart-2/10 border-b border-border">
                <Film className="h-4 w-4 text-chart-2" />
                <span className="font-semibold text-sm text-chart-2">Roteiro</span>
              </div>
              {loadingDetail ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : videoScript ? (
                <div className="p-4 space-y-4 text-sm">
                  {videoScript.format && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Formato</p>
                      <p>{videoScript.format}</p>
                    </div>
                  )}
                  {videoScript.script_text && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Roteiro</p>
                      <p className="whitespace-pre-wrap bg-secondary/40 rounded-lg p-4 text-sm leading-relaxed">
                        {videoScript.script_text}
                      </p>
                    </div>
                  )}
                  {videoScript.reference_links && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Referências</p>
                      <a
                        href={videoScript.reference_links}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-primary hover:underline text-sm"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {videoScript.reference_links}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Status do roteiro: {videoScript.status}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-4">
                  Nenhum roteiro vinculado a esta demanda.
                </p>
              )}
            </div>
          )}

          {/* Arte Brief */}
          {demand.area === 'Arte' && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-chart-3/10 border-b border-border">
                <Palette className="h-4 w-4 text-chart-3" />
                <span className="font-semibold text-sm text-chart-3">Briefing de Arte</span>
              </div>
              {loadingDetail ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : arteBrief ? (
                <div className="p-4 space-y-4 text-sm">
                  {arteBrief.format && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Formato</p>
                      <p>{arteBrief.format}</p>
                    </div>
                  )}
                  {arteBrief.description && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Descrição</p>
                      <p className="whitespace-pre-wrap bg-secondary/40 rounded-lg p-4 text-sm leading-relaxed">
                        {arteBrief.description}
                      </p>
                    </div>
                  )}
                  {arteBrief.colors && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Cores</p>
                      <p>{arteBrief.colors}</p>
                    </div>
                  )}
                  {arteBrief.elements && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Elementos</p>
                      <p>{arteBrief.elements}</p>
                    </div>
                  )}
                  {arteBrief.reference_links && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Referências</p>
                      <a
                        href={arteBrief.reference_links}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-primary hover:underline text-sm"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {arteBrief.reference_links}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Status do briefing: {arteBrief.status}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-4">
                  Nenhum briefing vinculado a esta demanda.
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <DemandFormDialog
              demand={demand}
              onSuccess={() => {
                onSuccess()
                onClose()
              }}
              trigger={
                <button 
                  type="button" 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
              }
            />
            <DeleteDialog
              title="Excluir Demanda"
              description={`Tem certeza que deseja excluir "${demand.name}"? Esta ação não pode ser desfeita.`}
              onConfirm={() => deleteDemand(demand.id)}
              onSuccess={() => {
                onSuccess()
                onClose()
              }}
              trigger={
                <button 
                  type="button" 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              }
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Task Item ───���───────────────────────────────────────────────────────────
function TaskItem({
  demand,
  onToggleComplete,
  onOpenDetail,
  isPending,
}: {
  demand: Demand
  onToggleComplete: (demand: Demand) => void
  onOpenDetail: (demand: Demand) => void
  isPending: boolean
}) {
  const isPublished = demand.status === 'Publicado'
  const overdue = isOverdue(demand.deadline, demand.status)
  const isVideo = demand.area === 'Vídeo'
  const isArte = demand.area === 'Arte'

  return (
    <div
      className={cn(
        "group flex items-center gap-3 py-3 px-4 rounded-lg transition-all",
        "hover:bg-secondary/50 cursor-pointer",
        isPublished && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <div 
        onClick={(e) => {
          e.stopPropagation()
          onToggleComplete(demand)
        }}
        className="shrink-0"
      >
        <Checkbox
          checked={isPublished}
          disabled={isPending}
          className={cn(
            "h-5 w-5 rounded-full border-2 transition-colors",
            isPublished 
              ? "bg-success border-success data-[state=checked]:bg-success data-[state=checked]:border-success" 
              : "border-muted-foreground/50 hover:border-primary"
          )}
        />
      </div>

      {/* Task content */}
      <div 
        className="flex-1 min-w-0 flex items-center gap-3"
        onClick={() => onOpenDetail(demand)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isVideo && <Film className="h-3.5 w-3.5 text-chart-2 shrink-0" />}
            {isArte && <Palette className="h-3.5 w-3.5 text-chart-3 shrink-0" />}
            <span 
              className={cn(
                "text-sm font-medium truncate",
                isPublished && "line-through text-muted-foreground"
              )}
            >
              {demand.name}
            </span>
          </div>
          {/* Sub info */}
          <div className="flex items-center gap-3 mt-1">
            {demand.deadline && (
              <span className={cn(
                "text-xs flex items-center gap-1",
                overdue ? "text-destructive font-medium" : "text-muted-foreground"
              )}>
                <Calendar className="h-3 w-3" />
                {formatDeadline(demand.deadline)}
              </span>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{demand.responsible_name || 'Não atribuído'}</span>
            </span>
          </div>
        </div>

        {/* Priority indicator */}
        <Flag className={cn(
          "h-3.5 w-3.5 shrink-0",
          priorityConfig[demand.priority].color
        )} />

        {/* Overdue badge */}
        {overdue && (
          <Badge variant="destructive" className="text-xs shrink-0">
            Atrasado
          </Badge>
        )}

        {/* Arrow indicator */}
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </div>
  )
}

// ─── Client Group ────────────────────────────────────────────────────────────
function ClientGroup({
  clientName,
  demands,
  onToggleComplete,
  onOpenDetail,
  isPending,
  defaultExpanded = true,
}: {
  clientName: string
  demands: Demand[]
  onToggleComplete: (demand: Demand) => void
  onOpenDetail: (demand: Demand) => void
  isPending: boolean
  defaultExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const clientColor = getClientColor(clientName)
  const completedCount = demands.filter(d => d.status === 'Publicado').length
  const overdueCount = demands.filter(d => isOverdue(d.deadline, d.status)).length

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Client header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className={cn("h-3 w-3 rounded-full shrink-0", clientColor)} />
        <span className="font-semibold text-base flex-1 text-left">{clientName}</span>
        
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {overdueCount} atrasado{overdueCount > 1 ? 's' : ''}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {completedCount}/{demands.length}
          </span>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )} />
        </div>
      </button>

      {/* Tasks list */}
      {isExpanded && (
        <div className="border-t border-border divide-y divide-border/50">
          {demands.map((demand) => (
            <TaskItem
              key={demand.id}
              demand={demand}
              onToggleComplete={onToggleComplete}
              onOpenDetail={onOpenDetail}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Checklist ──────────────────────────────────────────────────────────
export function DemandsChecklist() {
  const { user } = useAuth()
  const [demandItems, setDemandItems] = useState<Demand[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [filters, setFilter, resetFilters] = usePersistedFilters('demands-filters', {
    searchQuery: '',
    clientFilter: 'all',
    areaFilter: [] as string[],
    responsibleFilter: 'all',
    dateFrom: '',
    dateTo: '',
    statusFilter: 'all' as 'all' | 'a-fazer' | 'feito' | 'atrasado',
    sortTasks: 'deadline-asc' as 'deadline-asc' | 'deadline-desc' | 'name-asc' | 'name-desc' | 'priority-desc' | 'priority-asc' | 'created-desc' | 'created-asc',
    sortClients: 'name-asc' as 'name-asc' | 'name-desc' | 'tasks-desc' | 'tasks-asc' | 'overdue-desc',
  })

  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false)
  const AREAS = ['Arte', 'Vídeo', 'Tráfego', 'Comunicação']

  const toggleArea = (area: string) => {
    const current = filters.areaFilter as string[]
    const updated = current.includes(area)
      ? current.filter((a) => a !== area)
      : [...current, area]
    setFilter('areaFilter', updated)
  }

  useEffect(() => {
    loadData()
  }, [user])

  async function loadData() {
    try {
      const [demandsData, clientsData, usersData] = await Promise.all([
        getDemands({ current_user_id: user?.id, current_user_role: user?.role }),
        getClients(),
        getUsers(),
      ])
      setDemandItems(demandsData)
      setClients(clientsData.map(c => ({ id: c.id, name: c.name })))
      setUsers(usersData.map(u => ({ id: u.id, name: u.name })))
    } catch (error) {
      console.error('[v0] Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle task completion
  const handleToggleComplete = (demand: Demand) => {
    const newStatus: DemandStatus = demand.status === 'Publicado' ? 'A Fazer' : 'Publicado'
    
    // Optimistic update
    setDemandItems((prev) =>
      prev.map((d) => d.id === demand.id ? { ...d, status: newStatus } : d)
    )
    
    startTransition(async () => {
      try {
        await updateDemandStatus(demand.id, newStatus)
      } catch {
        loadData()
      }
    })
  }

  const filteredDemands = useMemo(() => {
    const { searchQuery, clientFilter, areaFilter, responsibleFilter, dateFrom, dateTo, statusFilter } = filters
    return demandItems.filter((demand) => {
      if (demand.status === 'Atrasado') return false // legacy status
      const overdue = isOverdue(demand.deadline, demand.status)
      const isFeito = demand.status === 'Publicado'

      // Status filter
      if (statusFilter === 'a-fazer' && isFeito) return false
      if (statusFilter === 'feito' && !isFeito) return false
      if (statusFilter === 'atrasado' && (!overdue || isFeito)) return false

      const matchesSearch = demand.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesClient = clientFilter === 'all' || demand.client_id === clientFilter
      const selectedAreas = areaFilter as string[]
      const matchesArea = selectedAreas.length === 0 || selectedAreas.includes(demand.area)
      const matchesResponsible = responsibleFilter === 'all' || demand.responsible_id === responsibleFilter

      let matchesDate = true
      if (demand.deadline) {
        const demandDate = new Date(demand.deadline + 'T00:00:00')
        if (dateFrom) {
          if (demandDate < new Date(dateFrom + 'T00:00:00')) matchesDate = false
        }
        if (dateTo) {
          if (demandDate > new Date(dateTo + 'T23:59:59')) matchesDate = false
        }
      } else if (dateFrom || dateTo) {
        matchesDate = false
      }

      return matchesSearch && matchesClient && matchesArea && matchesResponsible && matchesDate
    })
  }, [demandItems, filters])

  // Priority order mapping for sorting
  const priorityOrder = { high: 3, medium: 2, low: 1 }

  // Sort tasks function
  const sortTasks = (tasks: Demand[], sortBy: string): Demand[] => {
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'deadline-asc': {
          const dateA = a.deadline ? new Date(a.deadline + 'T00:00:00').getTime() : Infinity
          const dateB = b.deadline ? new Date(b.deadline + 'T00:00:00').getTime() : Infinity
          return dateA - dateB
        }
        case 'deadline-desc': {
          const dateA = a.deadline ? new Date(a.deadline + 'T00:00:00').getTime() : -Infinity
          const dateB = b.deadline ? new Date(b.deadline + 'T00:00:00').getTime() : -Infinity
          return dateB - dateA
        }
        case 'name-asc':
          return a.name.localeCompare(b.name, 'pt-BR')
        case 'name-desc':
          return b.name.localeCompare(a.name, 'pt-BR')
        case 'priority-desc':
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'priority-asc':
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'created-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'created-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return 0
      }
    })
  }

  // Group demands by client
  const demandsByClient = useMemo(() => {
    const grouped: Record<string, Demand[]> = {}
    
    for (const demand of filteredDemands) {
      const clientName = demand.client_name || 'Sem cliente'
      if (!grouped[clientName]) {
        grouped[clientName] = []
      }
      grouped[clientName].push(demand)
    }
    
    // Sort tasks within each client group
    const sortedGroups = Object.entries(grouped).map(([clientName, tasks]) => {
      return [clientName, sortTasks(tasks, filters.sortTasks)] as [string, Demand[]]
    })

    // Sort client groups
    const { sortClients } = filters
    return sortedGroups.sort(([nameA, tasksA], [nameB, tasksB]) => {
      switch (sortClients) {
        case 'name-asc':
          return nameA.localeCompare(nameB, 'pt-BR')
        case 'name-desc':
          return nameB.localeCompare(nameA, 'pt-BR')
        case 'tasks-desc':
          return tasksB.length - tasksA.length
        case 'tasks-asc':
          return tasksA.length - tasksB.length
        case 'overdue-desc': {
          const overdueA = tasksA.filter(d => isOverdue(d.deadline, d.status)).length
          const overdueB = tasksB.filter(d => isOverdue(d.deadline, d.status)).length
          return overdueB - overdueA
        }
        default:
          return 0
      }
    })
  }, [filteredDemands, filters.sortTasks, filters.sortClients])

  const openDetail = (demand: Demand) => {
    setSelectedDemand(demand)
    setDetailOpen(true)
  }

  // Summary stats
  const totalDemands = sortedDemands.length
  const completedDemands = sortedDemands.filter(d => d.status === 'Publicado').length
  const overdueDemands = sortedDemands.filter(d => isOverdue(d.deadline, d.status)).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <DemandDetailSheet
        demand={selectedDemand}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onSuccess={loadData}
      />

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-semibold">{totalDemands}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Concluídas:</span>
          <span className="font-semibold text-success">{completedDemands}</span>
        </div>
        {overdueDemands > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Atrasadas:</span>
            <span className="font-semibold text-destructive">{overdueDemands}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-card border-border mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar demanda..."
                value={filters.searchQuery}
                onChange={(e) => setFilter('searchQuery', e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              <Select value={filters.clientFilter} onValueChange={(v) => setFilter('clientFilter', v)}>
                <SelectTrigger className="w-full sm:w-36 bg-secondary border-border text-xs sm:text-sm">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Multi-select Area */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAreaDropdownOpen(!areaDropdownOpen)}
                  className="inline-flex items-center justify-between w-full sm:w-32 px-3 h-10 bg-secondary border border-border rounded-md text-xs sm:text-sm hover:bg-secondary/80 transition-colors"
                >
                  <span className="truncate">
                    {(filters.areaFilter as string[]).length === 0
                      ? 'Áreas'
                      : (filters.areaFilter as string[]).length === 1
                      ? (filters.areaFilter as string[])[0]
                      : `${(filters.areaFilter as string[]).length} áreas`}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                </button>
                {areaDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setAreaDropdownOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-20 p-1">
                      {AREAS.map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleArea(area)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                        >
                          <div className={cn(
                            'h-4 w-4 border rounded flex items-center justify-center shrink-0',
                            (filters.areaFilter as string[]).includes(area)
                              ? 'bg-primary border-primary'
                              : 'border-input'
                          )}>
                            {(filters.areaFilter as string[]).includes(area) && (
                              <Check className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>
                          <span>{area}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Select value={filters.responsibleFilter} onValueChange={(v) => setFilter('responsibleFilter', v)}>
                <SelectTrigger className="w-full sm:w-36 bg-secondary border-border text-xs sm:text-sm">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.statusFilter as string} onValueChange={(v) => setFilter('statusFilter', v)}>
                <SelectTrigger className="w-full sm:w-36 bg-secondary border-border text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="a-fazer">A Fazer</SelectItem>
                  <SelectItem value="feito">Feito</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.sortClients} onValueChange={(v) => setFilter('sortClients', v)}>
                <SelectTrigger className="w-full sm:w-44 bg-secondary border-border text-xs sm:text-sm">
                  <SelectValue placeholder="Ordenar clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Cliente A-Z</SelectItem>
                  <SelectItem value="name-desc">Cliente Z-A</SelectItem>
                  <SelectItem value="tasks-desc">Mais tarefas</SelectItem>
                  <SelectItem value="tasks-asc">Menos tarefas</SelectItem>
                  <SelectItem value="overdue-desc">Mais atrasados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.sortTasks} onValueChange={(v) => setFilter('sortTasks', v)}>
                <SelectTrigger className="w-full sm:w-44 bg-secondary border-border text-xs sm:text-sm">
                  <SelectValue placeholder="Ordenar tarefas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline-asc">Prazo (mais próximo)</SelectItem>
                  <SelectItem value="deadline-desc">Prazo (mais distante)</SelectItem>
                  <SelectItem value="name-asc">Nome A-Z</SelectItem>
                  <SelectItem value="name-desc">Nome Z-A</SelectItem>
                  <SelectItem value="priority-desc">Prioridade (alta primeiro)</SelectItem>
                  <SelectItem value="priority-asc">Prioridade (baixa primeiro)</SelectItem>
                  <SelectItem value="created-desc">Mais recentes</SelectItem>
                  <SelectItem value="created-asc">Mais antigas</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <label className="text-xs text-muted-foreground whitespace-nowrap">De</label>
                <Input
                  type="datetime-local"
                  value={filters.dateFrom}
                  onChange={(e) => setFilter('dateFrom', e.target.value)}
                  className="w-full sm:w-36 bg-secondary border-border text-xs sm:text-sm"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-muted-foreground whitespace-nowrap">Até</label>
                <Input
                  type="datetime-local"
                  value={filters.dateTo}
                  onChange={(e) => setFilter('dateTo', e.target.value)}
                  className="w-full sm:w-36 bg-secondary border-border text-xs sm:text-sm"
                />
              </div>

              {(filters.dateFrom || filters.dateTo || filters.clientFilter !== 'all' || (filters.areaFilter as string[]).length > 0 || filters.responsibleFilter !== 'all' || filters.statusFilter !== 'all' || filters.sortClients !== 'name-asc' || filters.sortTasks !== 'deadline-asc') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-muted-foreground hover:text-foreground underline whitespace-nowrap self-center"
                >
                  Limpar filtros
                </button>
              )}
              <div className="col-span-2 sm:col-span-1">
                <DemandFormDialog onSuccess={loadData} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client groups */}
      <div className="space-y-4">
        {demandsByClient.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p className="text-lg font-medium">Nenhuma demanda encontrada</p>
            <p className="text-sm mt-1">Tente ajustar os filtros ou criar uma nova demanda</p>
          </div>
        ) : (
          demandsByClient.map(([clientName, demands]) => (
            <ClientGroup
              key={clientName}
              clientName={clientName}
              demands={demands}
              onToggleComplete={handleToggleComplete}
              onOpenDetail={openDetail}
              isPending={isPending}
            />
          ))
        )}
      </div>
    </>
  )
}
