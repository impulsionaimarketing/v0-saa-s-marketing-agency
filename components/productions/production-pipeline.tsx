'use client'

// Production pipeline component - v2024
import React, { useState, useEffect, useTransition, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  DialogClose,
} from '@/components/ui/dialog'
import {
  Search,
  Video,
  ImageIcon,
  Calendar,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  GripVertical,
  Pencil,
} from 'lucide-react'
import {
  getProductions,
  updateProductionStatus,
  deleteProduction,
  type Production,
} from '@/lib/data/productions'
import { PRODUCTION_STATUSES } from '@/lib/constants'
import { getClients, type Client } from '@/lib/data/clients'
import { ProductionFormDialog } from './production-form-dialog'
import { DeleteDialog } from '@/components/shared/delete-dialog'
import { cn } from '@/lib/utils'
import { getDemands, type Demand } from '@/lib/data/demands' // Import Demand
import { VideoUploadSection } from './video-upload-section'
import { getProductionFiles, type ProductionFile } from '@/lib/data/production-files'
import { useAuth } from '@/lib/hooks/use-auth'
import { usePersistedFilters } from '@/lib/hooks/use-persisted-filters'
import { useDragScroll } from '@/lib/hooks/use-drag-scroll'

const statusColors: Record<string, string> = {
  Planejamento: 'bg-slate-500',
  'Aprovação do Cliente': 'bg-yellow-500',
  Captação: 'bg-orange-500',
  Edição: 'bg-blue-500',
  Revisão: 'bg-purple-500',
  Legenda: 'bg-indigo-500',
  Programado: 'bg-cyan-500',
  Publicado: 'bg-green-500',
  'Em Tráfego': 'bg-emerald-500',
  Finalizado: 'bg-teal-500',
}

export function ProductionPipeline() {
  const { user } = useAuth()
  const [productions, setProductions] = useState<Production[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [demands, setDemands] = useState<Demand[]>([]) // Declare Demand

  const [filters, setFilter, resetFilters] = usePersistedFilters('productions-filters', {
    search: '',
    filterClient: 'all',
    filterType: 'all',
    dateFrom: '',
    dateTo: '',
  })
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null)
  const [productionFiles, setProductionFiles] = useState<ProductionFile[]>([])
  const [draggedItem, setDraggedItem] = useState<Production | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { onDragStart: dragScrollStart, onDragEnd: dragScrollEnd } = useDragScroll()

  const loadData = () => {
    startTransition(async () => {
      const [productionsData, clientsData, demandsData] = await Promise.all([
        getProductions({
          current_user_id: user?.id,
          current_user_role: user?.role
        }),
        getClients(),
        getDemands({
          current_user_id: user?.id,
          current_user_role: user?.role
        }),
      ])
      setProductions(productionsData)
      setClients(clientsData)
      setDemands(demandsData) // Set Demands
    })
  }

  const loadFiles = (productionId: string) => {
    startTransition(async () => {
      try {
        const files = await getProductionFiles(productionId)
        setProductionFiles(files)
      } catch (error) {
        console.error('[v0] Error loading production files:', error)
        setProductionFiles([])
      }
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedProduction?.id) {
      loadFiles(selectedProduction.id)
    } else {
      setProductionFiles([])
    }
  }, [selectedProduction?.id])

  const filteredProductions = productions.filter((production) => {
    const { search, filterClient, filterType, dateFrom, dateTo } = filters
    const matchesSearch =
      search === '' ||
      production.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      production.notes?.toLowerCase().includes(search.toLowerCase())
    const matchesClient =
      filterClient === 'all' || production.client_id === filterClient
    const matchesType = filterType === 'all' || production.type === filterType

    // Date filtering on post_date
    let matchesDate = true
    if (production.post_date) {
      const postDate = new Date(production.post_date)
      if (dateFrom) {
        const fromDate = new Date(dateFrom + 'T00:00:00')
        if (postDate < fromDate) matchesDate = false
      }
      if (dateTo) {
        const toDate = new Date(dateTo + 'T23:59:59')
        if (postDate > toDate) matchesDate = false
      }
    } else if (dateFrom || dateTo) {
      matchesDate = false
    }

    return matchesSearch && matchesClient && matchesType && matchesDate
  })

  const getProductionsByStatus = (status: string) => {
    return filteredProductions.filter((p) => p.status === status)
  }

  const handleMoveStatus = (production: Production, direction: 'prev' | 'next') => {
    const currentIndex = PRODUCTION_STATUSES.indexOf(production.status)
    if (currentIndex === -1) return

    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= PRODUCTION_STATUSES.length) return

    const newStatus = PRODUCTION_STATUSES[newIndex]
    updateProductionStatus(production.id, newStatus).then(loadData)
  }

  const handleDragStart = (e: React.DragEvent, production: Production) => {
    setDraggedItem(production)
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

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (!draggedItem) return

    const statusChanged = draggedItem.status !== newStatus

    // Reorder optimistically
    setProductions((prev) => {
      const items = [...prev]
      const draggedIndex = items.findIndex((p) => p.id === draggedItem.id)
      if (draggedIndex === -1) return prev
      const [removed] = items.splice(draggedIndex, 1)
      removed.status = newStatus
      if (dragOverId) {
        const targetIndex = items.findIndex((p) => p.id === dragOverId)
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

    if (statusChanged) {
      startTransition(async () => {
        await updateProductionStatus(draggedItem.id, newStatus)
      })
    }

    setDraggedItem(null)
    setDragOverId(null)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar criativos..."
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              <Select value={filters.filterClient} onValueChange={(v) => setFilter('filterClient', v)}>
                <SelectTrigger className="w-full sm:w-36 text-xs sm:text-sm">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.filterType} onValueChange={(v) => setFilter('filterType', v)}>
                <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Vídeo">Vídeo</SelectItem>
                  <SelectItem value="Arte">Arte</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <label className="text-xs text-muted-foreground whitespace-nowrap">De</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilter('dateFrom', e.target.value)}
                  className="w-full sm:w-36 text-xs sm:text-sm"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-muted-foreground whitespace-nowrap">Até</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilter('dateTo', e.target.value)}
                  className="w-full sm:w-36 text-xs sm:text-sm"
                />
              </div>

              {(filters.dateFrom || filters.dateTo || filters.filterClient !== 'all' || filters.filterType !== 'all') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-muted-foreground hover:text-foreground underline whitespace-nowrap self-center"
                >
                  Limpar filtros
                </button>
              )}

              {isPending && <div className="flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>}

              <div className="col-span-2 sm:col-span-1 sm:ml-auto">
                <ProductionFormDialog onSuccess={loadData} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Status Bar */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {PRODUCTION_STATUSES.map((status, index) => (
          <div
            key={status}
            className={cn(
              'flex-1 min-w-[100px] h-2 rounded-full',
              statusColors[status]
            )}
            title={status}
          />
        ))}
      </div>

      {/* Pipeline Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PRODUCTION_STATUSES.map((status, statusIndex) => (
          <div key={status} className="flex-shrink-0 w-[280px]">
            <Card className="bg-card border-border h-full">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div
                      className={cn('w-3 h-3 rounded-full', statusColors[status])}
                    />
                    {status}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {getProductionsByStatus(status).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent 
                className="p-2 space-y-2 min-h-[400px] max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-hide"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                {getProductionsByStatus(status).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum criativo
                  </p>
                ) : (
                  <>
                    {/* Render Productions */}
                    {getProductionsByStatus(status).map((production) => (
                      <Card 
                        key={production.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, production)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleCardDragOver(e, production.id)}
                        className={cn(
                          "bg-secondary/50 border-border cursor-grab active:cursor-grabbing hover:bg-secondary/70 transition-all hover:border-primary/50",
                          draggedItem?.id === production.id && 'opacity-50',
                          dragOverId === production.id && draggedItem?.id !== production.id && 'border-t-2 border-t-primary'
                        )}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  {production.type === 'Vídeo' ? (
                                    <Video className="h-4 w-4 text-blue-400" />
                                  ) : (
                                    <ImageIcon className="h-4 w-4 text-pink-400" />
                                  )}
                                  <span className="font-medium text-sm truncate max-w-[150px]">
                                    {production.client_name || 'Cliente'}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {production.type}
                                </Badge>
                              </div>

                              {production.notes && (
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                  {production.notes}
                                </p>
                              )}

                              <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span className="truncate max-w-[80px]">
                                    {production.responsible_name || 'Não atribuído'}
                                  </span>
                                </div>
                                {production.post_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {new Date(production.post_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedProduction(production)
                                  }}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Ver detalhes
                                </button>
                                <DeleteDialog
                                  title="Excluir Criativo"
                                  description="Tem certeza que deseja excluir este criativo? Esta ação não pode ser desfeita."
                                  onConfirm={() => deleteProduction(production.id)}
                                  onSuccess={loadData}
                                  trigger={
                                    <button
                                      type="button"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 p-1 rounded hover:bg-destructive/10 ml-auto"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      Excluir
                                    </button>
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Production Details Dialog */}
      <Dialog open={selectedProduction !== null} onOpenChange={(open) => !open && setSelectedProduction(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProduction?.type === 'Vídeo' ? (
                <Video className="h-5 w-5 text-blue-400" />
              ) : (
                <ImageIcon className="h-5 w-5 text-pink-400" />
              )}
              {selectedProduction?.client_name || 'Produção'}
            </DialogTitle>
            <DialogClose />
          </DialogHeader>

          {selectedProduction && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                  <Badge className={selectedProduction.type === 'Vídeo' ? 'bg-blue-500/20 text-blue-600' : 'bg-pink-500/20 text-pink-600'}>
                    {selectedProduction.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge variant="secondary">{selectedProduction.status}</Badge>
                </div>
              </div>

              {/* Notes */}
              {selectedProduction.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm text-foreground bg-secondary/50 p-3 rounded">
                    {selectedProduction.notes}
                  </p>
                </div>
              )}

              {/* Client Info */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                <p className="text-sm text-foreground">
                  {selectedProduction.client_name}
                </p>
              </div>

              {/* Responsible */}
              {selectedProduction.responsible_name && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Responsável</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-foreground">
                      {selectedProduction.responsible_name}
                    </p>
                  </div>
                </div>
              )}

              {/* Post Date */}
              {selectedProduction.post_date && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Data de Publicação</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-foreground">
                      {new Date(selectedProduction.post_date).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Created At */}
              {selectedProduction.created_at && (
                <div className="text-xs text-muted-foreground border-t border-border pt-3">
                  Criada em {new Date(selectedProduction.created_at).toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}

              {/* Video Upload Section */}
              {selectedProduction.id && (
                <VideoUploadSection
                  productionId={selectedProduction.id}
                  files={productionFiles}
                  onUpdate={() => loadFiles(selectedProduction.id)}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
