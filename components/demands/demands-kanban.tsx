'use client'

import React, { useState, useEffect, useMemo, useTransition, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Calendar, User, GripVertical, Loader2, Pencil, Trash2, ChevronDown, Check, AlertTriangle, Film, Palette, ExternalLink, Clock, ArrowUpDown } from 'lucide-react'
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
import { useDragScroll } from '@/lib/hooks/use-drag-scroll'

type DemandStatus = Demand['status']

// Only two columns: A Fazer and Feito
const columns: { id: DemandStatus; title: string; color: string }[] = [
  { id: 'A Fazer', title: 'A Fazer', color: 'bg-muted' },
  { id: 'Publicado', title: 'Feito', color: 'bg-success' },
]

const areaColors: Record<string, string> = {
  'Arte': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  'Vídeo': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  'Tráfego': 'bg-primary/10 text-primary border-primary/20',
  'Comunicação': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
}

function isOverdue(deadline: string | null, status: DemandStatus): boolean {
  if (!deadline || status === 'Publicado') return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(deadline + 'T00:00:00')
  return d < now
}

// ─── Detail Modal ────────────────────────────────────────────────────────────
function DemandDetailModal({
  demand,
  open,
  onClose,
}: {
  demand: Demand | null
  open: boolean
  onClose: () => void
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {demand.area === 'Vídeo' ? (
              <Film className="h-5 w-5 text-chart-2 mt-0.5 shrink-0" />
            ) : demand.area === 'Arte' ? (
              <Palette className="h-5 w-5 text-chart-3 mt-0.5 shrink-0" />
            ) : null}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-left leading-tight">{demand.name}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className={cn('text-xs', areaColors[demand.area])}>
                  {demand.area}
                </Badge>
                <Badge variant="secondary" className="text-xs">{demand.status}</Badge>
                {overdue && (
                  <Badge variant="destructive" className="text-xs flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Atrasado
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Cliente</p>
              <p className="font-medium">{demand.client_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Responsável</p>
              <p className="font-medium">{demand.responsible_name || 'Não atribuído'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Prazo</p>
              <p className={cn('font-medium', overdue && 'text-destructive')}>
                {demand.deadline
                  ? `${new Date(demand.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}${demand.deadline_time ? ` às ${demand.deadline_time.slice(0, 5)}` : ''}`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Prioridade</p>
              <p className="font-medium capitalize">{demand.priority}</p>
            </div>
          </div>

          {demand.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Descrição</p>
              <p className="text-sm whitespace-pre-wrap bg-secondary/40 rounded-md p-3">
                {demand.description}
              </p>
            </div>
          )}

          {/* Video Script */}
          {demand.area === 'Vídeo' && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-chart-2/10 border-b border-border">
                <Film className="h-4 w-4 text-chart-2" />
                <span className="font-semibold text-sm text-chart-2">Roteiro</span>
              </div>
              {loadingDetail ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : videoScript ? (
                <div className="p-4 space-y-3 text-sm">
                  {videoScript.format && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Formato</p>
                      <p>{videoScript.format}</p>
                    </div>
                  )}
                  {videoScript.script_text && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Roteiro</p>
                      <p className="whitespace-pre-wrap bg-secondary/40 rounded-md p-3 text-sm leading-relaxed">
                        {videoScript.script_text}
                      </p>
                    </div>
                  )}
                  {videoScript.reference_links && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Referências</p>
                      <a
                        href={videoScript.reference_links}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline text-xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {videoScript.reference_links}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                    <Clock className="h-3 w-3" />
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
              <div className="flex items-center gap-2 px-4 py-2 bg-chart-3/10 border-b border-border">
                <Palette className="h-4 w-4 text-chart-3" />
                <span className="font-semibold text-sm text-chart-3">Briefing de Arte</span>
              </div>
              {loadingDetail ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : arteBrief ? (
                <div className="p-4 space-y-3 text-sm">
                  {arteBrief.format && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Formato</p>
                      <p>{arteBrief.format}</p>
                    </div>
                  )}
                  {arteBrief.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                      <p className="whitespace-pre-wrap bg-secondary/40 rounded-md p-3 text-sm leading-relaxed">
                        {arteBrief.description}
                      </p>
                    </div>
                  )}
                  {arteBrief.colors && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cores</p>
                      <p>{arteBrief.colors}</p>
                    </div>
                  )}
                  {arteBrief.elements && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Elementos</p>
                      <p>{arteBrief.elements}</p>
                    </div>
                  )}
                  {arteBrief.reference_links && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Referências</p>
                      <a
                        href={arteBrief.reference_links}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline text-xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {arteBrief.reference_links}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                    <Clock className="h-3 w-3" />
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Kanban ─────────────────────────────────────────────────────────────
export function DemandsKanban() {
  const { user } = useAuth()
  const [demandItems, setDemandItems] = useState<Demand[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [draggedItem, setDraggedItem] = useState<Demand | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
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
  })

  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false)
  const [reorganizeModes, setReorganizeModes] = useState<Record<string, boolean>>({})
  const [reorderDraggedId, setReorderDraggedId] = useState<string | null>(null)
  const [reorderDragOverId, setReorderDragOverId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'schedule'>('kanban')
  const AREAS = ['Arte', 'Vídeo', 'Tráfego', 'Comunicação']
  const { onDragStart: dragScrollStart, onDragEnd: dragScrollEnd } = useDragScroll()

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

  // Mark as published via checkbox — optimistic
  const handlePublish = (e: React.MouseEvent, demand: Demand) => {
    e.stopPropagation()
    if (demand.status === 'Publicado') return
    setDemandItems((prev) =>
      prev.map((d) => d.id === demand.id ? { ...d, status: 'Publicado' } : d)
    )
    startTransition(async () => {
      try {
        await updateDemandStatus(demand.id, 'Publicado')
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

  const getColumnDemands = (status: DemandStatus) =>
    filteredDemands.filter((d) => d.status === status)

  const handleDragStart = (e: React.DragEvent, demand: Demand) => {
    setDraggedItem(demand)
    e.dataTransfer.effectAllowed = 'move'
    dragScrollStart()
  }

  const handleDragEnd = () => {
    dragScrollEnd()
    setDraggedItem(null)
    setDragOverId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleCardDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedItem?.id !== targetId) setDragOverId(targetId)
  }

  const handleDrop = (e: React.DragEvent, newStatus: DemandStatus) => {
    e.preventDefault()
    if (!draggedItem) return

    setDemandItems((prev) => {
      const items = [...prev]
      const draggedIndex = items.findIndex((d) => d.id === draggedItem.id)
      if (draggedIndex === -1) return prev

      // Remove dragged item
      const [removed] = items.splice(draggedIndex, 1)
      removed.status = newStatus

      // If dropped over a specific card, insert before it
      if (dragOverId) {
        const targetIndex = items.findIndex((d) => d.id === dragOverId)
        if (targetIndex !== -1) {
          items.splice(targetIndex, 0, removed)
        } else {
          items.push(removed)
        }
      } else {
        items.push(removed)
      }
      return items
    })

    // Persist status change if column changed
    if (draggedItem.status !== newStatus) {
      startTransition(async () => {
        try {
          await updateDemandStatus(draggedItem.id, newStatus)
        } catch {
          loadData()
        }
      })
    }

    setDraggedItem(null)
    setDragOverId(null)
  }

  const openDetail = (demand: Demand) => {
    setSelectedDemand(demand)
    setDetailOpen(true)
  }

  const toggleReorganize = (columnId: string) => {
    setReorganizeModes(prev => ({ ...prev, [columnId]: !prev[columnId] }))
  }

  const handleReorderDragStart = (e: React.DragEvent, demandId: string) => {
    setReorderDraggedId(demandId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleReorderDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (targetId !== reorderDraggedId) setReorderDragOverId(targetId)
  }

  const handleReorderDrop = (e: React.DragEvent, targetId: string, columnId: DemandStatus) => {
    e.preventDefault()
    e.stopPropagation()
    if (!reorderDraggedId || reorderDraggedId === targetId) return

    setDemandItems(prev => {
      const items = [...prev]
      const fromIdx = items.findIndex(d => d.id === reorderDraggedId)
      const toIdx = items.findIndex(d => d.id === targetId)
      if (fromIdx === -1 || toIdx === -1) return prev
      const [removed] = items.splice(fromIdx, 1)
      items.splice(toIdx, 0, removed)
      return items
    })

    setReorderDraggedId(null)
    setReorderDragOverId(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <DemandDetailModal
        demand={selectedDemand}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* Filters */}
      <Card className="bg-card border-border">
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

              <div className="flex items-center gap-1">
                <label className="text-xs text-muted-foreground whitespace-nowrap">De</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilter('dateFrom', e.target.value)}
                  className="w-full sm:w-36 bg-secondary border-border text-xs sm:text-sm"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-muted-foreground whitespace-nowrap">Até</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilter('dateTo', e.target.value)}
                  className="w-full sm:w-36 bg-secondary border-border text-xs sm:text-sm"
                />
              </div>

              {(filters.dateFrom || filters.dateTo || filters.clientFilter !== 'all' || (filters.areaFilter as string[]).length > 0 || filters.responsibleFilter !== 'all' || filters.statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-muted-foreground hover:text-foreground underline whitespace-nowrap self-center"
                >
                  Limpar filtros
                </button>
              )}
              
              {/* Toggle View Mode */}
              <div className="flex items-center gap-1 border border-border rounded-md p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
                    viewMode === 'kanban'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <ArrowUpDown className="h-3 w-3" />
                  Kanban
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('schedule')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
                    viewMode === 'schedule'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <Clock className="h-3 w-3" />
                  Horários
                </button>
              </div>
              
              <div className="col-span-2 sm:col-span-1">
                <DemandFormDialog onSuccess={loadData} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban board */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnDemands = getColumnDemands(column.id)
            const overdueCount = columnDemands.filter(d => isOverdue(d.deadline, d.status)).length
            const isReorganizing = !!reorganizeModes[column.id]

            return (
              <div key={column.id} className="flex-shrink-0 w-72">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={cn('h-3 w-3 rounded-full', column.color)} />
                  <h3 className="font-semibold text-sm">{column.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {columnDemands.length}
                  </Badge>
                  {overdueCount > 0 && column.id !== 'Publicado' && (
                    <Badge variant="destructive" className="text-xs flex items-center gap-1 px-1.5">
                      <AlertTriangle className="h-3 w-3" />
                      {overdueCount}
                    </Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleReorganize(column.id)}
                    title={isReorganizing ? 'Sair do modo reorganizar' : 'Reorganizar cards'}
                    className={cn(
                      'ml-auto flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors',
                      isReorganizing
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {isReorganizing ? 'Concluir' : 'Ordenar'}
                  </button>
                </div>

                {/* Column content */}
                <div
                  className="space-y-2 min-h-[400px] max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-hide rounded-lg bg-secondary/30 p-2"
                  onDragOver={isReorganizing ? undefined : handleDragOver}
                  onDrop={isReorganizing ? undefined : (e) => handleDrop(e, column.id)}
                >
                  {columnDemands.map((demand) => {
                    const overdue = isOverdue(demand.deadline, demand.status)
                    const isPublished = demand.status === 'Publicado'
                    const isVideo = demand.area === 'Vídeo'
                    const isArte = demand.area === 'Arte'

                    /* ── Compact reorganize card ── */
                    if (isReorganizing) {
                      return (
                        <div
                          key={demand.id}
                          draggable
                          onDragStart={(e) => handleReorderDragStart(e, demand.id)}
                          onDragEnd={() => { setReorderDraggedId(null); setReorderDragOverId(null) }}
                          onDragOver={(e) => handleReorderDragOver(e, demand.id)}
                          onDrop={(e) => handleReorderDrop(e, demand.id, column.id)}
                          className={cn(
                            'flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2 cursor-grab active:cursor-grabbing select-none transition-all',
                            reorderDraggedId === demand.id && 'opacity-40',
                            reorderDragOverId === demand.id && reorderDraggedId !== demand.id && 'border-t-2 border-t-primary'
                          )}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{demand.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{demand.client_name}</p>
                          </div>
                          {overdue && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
                          {isVideo && <Film className="h-3 w-3 text-chart-2 shrink-0" />}
                          {isArte && <Palette className="h-3 w-3 text-chart-3 shrink-0" />}
                        </div>
                      )
                    }

                    /* ── Full card (normal mode) ── */
                    return (
                      <Card
                        key={demand.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, demand)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleCardDragOver(e, demand.id)}
                        className={cn(
                          'bg-card border-border cursor-grab active:cursor-grabbing transition-all hover:border-primary/50',
                          overdue && 'border-destructive/50',
                          draggedItem?.id === demand.id && 'opacity-50',
                          dragOverId === demand.id && draggedItem?.id !== demand.id && 'border-t-2 border-t-primary'
                        )}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">

                              {/* Overdue tag */}
                              {overdue && (
                                <div className="flex items-center gap-1 mb-2 text-xs text-destructive font-medium">
                                  <AlertTriangle className="h-3 w-3" />
                                  Atrasado
                                </div>
                              )}

                              {/* Title row with click to open detail */}
                              <button
                                type="button"
                                onClick={() => openDetail(demand)}
                                className="text-left w-full group"
                              >
                                <div className="flex items-center gap-1.5">
                                  {isVideo && <Film className="h-3 w-3 text-chart-2 shrink-0" />}
                                  {isArte && <Palette className="h-3 w-3 text-chart-3 shrink-0" />}
                                  <p className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                                    {demand.name}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{demand.client_name}</p>
                              </button>

                              {demand.description && (
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                  {demand.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <Badge variant="outline" className={cn('text-xs', areaColors[demand.area])}>
                                  {demand.area}
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span className="truncate max-w-[80px]">{demand.responsible_name || 'Não atribuído'}</span>
                                </div>
                                {demand.deadline && (
                                  <div className={cn(
                                    'flex items-center gap-1.5 text-xs',
                                    overdue ? 'text-destructive font-medium' : 'text-muted-foreground'
                                  )}>
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {new Date(demand.deadline + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                      {demand.deadline_time && ` ${demand.deadline_time.slice(0, 5)}`}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action row */}
                              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                                {/* Publish checkbox */}
                                <button
                                  type="button"
                                  onClick={(e) => handlePublish(e, demand)}
                                  title={isPublished ? 'Publicado' : 'Marcar como publicado'}
                                  className={cn(
                                    'flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors',
                                    isPublished
                                      ? 'text-success bg-success/10 cursor-default'
                                      : 'text-muted-foreground hover:text-success hover:bg-success/10'
                                  )}
                                >
                                  <div className={cn(
                                    'h-4 w-4 border-2 rounded flex items-center justify-center shrink-0',
                                    isPublished ? 'bg-success border-success' : 'border-muted-foreground'
                                  )}>
                                    {isPublished && <Check className="h-3 w-3 text-white" />}
                                  </div>
                                    {isPublished ? 'Feito' : 'Marcar como feito'}
                                </button>

                                <DemandFormDialog
                                  demand={demand}
                                  onSuccess={loadData}
                                  trigger={
                                    <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary ml-auto">
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                  }
                                />
                                <DeleteDialog
                                  title="Excluir Demanda"
                                  description={`Tem certeza que deseja excluir "${demand.name}"? Esta ação não pode ser desfeita.`}
                                  onConfirm={() => deleteDemand(demand.id)}
                                  onSuccess={loadData}
                                  trigger={
                                    <button type="button" className="flex items-center gap-1 text-xs text-destructive hover:text-destructive p-1 rounded hover:bg-destructive/10">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  {columnDemands.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                      Nenhuma demanda
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Schedule View - Organized by Time */}
      {viewMode === 'schedule' && (
        <ScheduleView
          demands={filteredDemands}
          onOpenDetail={openDetail}
          onPublish={handlePublish}
          onSuccess={loadData}
        />
      )}
    </>
  )
}

// Schedule View Component
function ScheduleView({
  demands,
  onOpenDetail,
  onPublish,
  onSuccess,
}: {
  demands: Demand[]
  onOpenDetail: (demand: Demand) => void
  onPublish: (e: React.MouseEvent, demand: Demand) => void
  onSuccess: () => void
}) {
  // Group demands by date and sort by time within each date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Demand[]> = {}
    
    // Filter demands that are not published and have a deadline
    const pendingDemands = demands.filter(d => d.status !== 'Publicado')
    
    for (const demand of pendingDemands) {
      const dateKey = demand.deadline || 'sem-data'
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(demand)
    }
    
    // Sort demands within each date by time
    for (const dateKey of Object.keys(groups)) {
      groups[dateKey].sort((a, b) => {
        // Items without time go to the end
        if (!a.deadline_time && !b.deadline_time) return 0
        if (!a.deadline_time) return 1
        if (!b.deadline_time) return -1
        return a.deadline_time.localeCompare(b.deadline_time)
      })
    }
    
    // Sort dates
    const sortedDates = Object.keys(groups).sort((a, b) => {
      if (a === 'sem-data') return 1
      if (b === 'sem-data') return -1
      return a.localeCompare(b)
    })
    
    return { groups, sortedDates }
  }, [demands])

  const formatDate = (dateStr: string) => {
    if (dateStr === 'sem-data') return 'Sem data definida'
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.getTime() === today.getTime()) {
      return 'Hoje'
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Amanhã'
    }
    
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long' 
    })
  }

  const isDateOverdue = (dateStr: string) => {
    if (dateStr === 'sem-data') return false
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  if (groupedByDate.sortedDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma demanda pendente encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groupedByDate.sortedDates.map((dateKey) => {
        const dateDemands = groupedByDate.groups[dateKey]
        const overdue = isDateOverdue(dateKey)
        
        return (
          <div key={dateKey}>
            {/* Date Header */}
            <div className={cn(
              'flex items-center gap-3 mb-3 pb-2 border-b',
              overdue ? 'border-destructive/50' : 'border-border'
            )}>
              <Calendar className={cn('h-5 w-5', overdue ? 'text-destructive' : 'text-primary')} />
              <h3 className={cn(
                'font-semibold text-lg capitalize',
                overdue && 'text-destructive'
              )}>
                {formatDate(dateKey)}
              </h3>
              <Badge variant={overdue ? 'destructive' : 'secondary'} className="text-xs">
                {dateDemands.length} {dateDemands.length === 1 ? 'demanda' : 'demandas'}
              </Badge>
              {overdue && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Atrasado
                </Badge>
              )}
            </div>
            
            {/* Demands for this date */}
            <div className="grid gap-2">
              {dateDemands.map((demand) => {
                const isVideo = demand.area === 'Vídeo'
                const isArte = demand.area === 'Arte'
                const itemOverdue = isOverdue(demand.deadline, demand.status)
                
                return (
                  <Card 
                    key={demand.id} 
                    className={cn(
                      'bg-card border-border hover:border-primary/50 transition-colors',
                      itemOverdue && 'border-destructive/50'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Time Column */}
                        <div className={cn(
                          'flex flex-col items-center justify-center w-16 shrink-0 py-2 px-3 rounded-md',
                          demand.deadline_time 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-muted text-muted-foreground'
                        )}>
                          <Clock className="h-4 w-4 mb-1" />
                          <span className="text-sm font-semibold">
                            {demand.deadline_time ? demand.deadline_time.slice(0, 5) : '--:--'}
                          </span>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(demand)}
                            className="text-left w-full group"
                          >
                            <div className="flex items-center gap-2">
                              {isVideo && <Film className="h-4 w-4 text-chart-2 shrink-0" />}
                              {isArte && <Palette className="h-4 w-4 text-chart-3 shrink-0" />}
                              <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                {demand.name}
                              </p>
                              {itemOverdue && (
                                <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                              )}
                            </div>
                          </button>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{demand.client_name}</span>
                            <Badge variant="outline" className={cn('text-xs', areaColors[demand.area])}>
                              {demand.area}
                            </Badge>
                            {demand.responsible_name && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {demand.responsible_name}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => onPublish(e, demand)}
                            title="Marcar como feito"
                            className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded transition-colors text-muted-foreground hover:text-success hover:bg-success/10"
                          >
                            <div className="h-4 w-4 border-2 border-muted-foreground rounded flex items-center justify-center shrink-0">
                              <Check className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                            </div>
                          </button>
                          <DemandFormDialog
                            demand={demand}
                            onSuccess={onSuccess}
                            trigger={
                              <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-secondary">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            }
                          />
                          <DeleteDialog
                            title="Excluir Demanda"
                            description={`Tem certeza que deseja excluir "${demand.name}"? Esta ação não pode ser desfeita.`}
                            onConfirm={() => deleteDemand(demand.id)}
                            onSuccess={onSuccess}
                            trigger={
                              <button type="button" className="flex items-center gap-1 text-xs text-destructive hover:text-destructive p-1.5 rounded hover:bg-destructive/10">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
