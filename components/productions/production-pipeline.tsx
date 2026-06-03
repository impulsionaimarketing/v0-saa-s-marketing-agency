'use client'

import React, { useState, useEffect, useTransition } from 'react'
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Search,
  Video,
  ImageIcon,
  Calendar,
  User,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileText,
  Send,
  Play,
  LayoutGrid,
  List,
  Plus,
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
import { VideoUploadSection } from './video-upload-section'
import { getProductionFiles, type ProductionFile } from '@/lib/data/production-files'
import { useAuth } from '@/lib/hooks/use-auth'
import { usePersistedFilters } from '@/lib/hooks/use-persisted-filters'

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  'Planejamento': { color: 'text-slate-700', bg: 'bg-slate-100', icon: FileText, label: 'Planejamento' },
  'Aprovação do Cliente': { color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock, label: 'Aguardando Aprovação' },
  'Captação': { color: 'text-orange-700', bg: 'bg-orange-100', icon: Video, label: 'Em Captação' },
  'Edição': { color: 'text-blue-700', bg: 'bg-blue-100', icon: Play, label: 'Em Edição' },
  'Revisão': { color: 'text-purple-700', bg: 'bg-purple-100', icon: Eye, label: 'Em Revisão' },
  'Legenda': { color: 'text-indigo-700', bg: 'bg-indigo-100', icon: FileText, label: 'Criando Legenda' },
  'Programado': { color: 'text-cyan-700', bg: 'bg-cyan-100', icon: Calendar, label: 'Programado' },
  'Publicado': { color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2, label: 'Publicado' },
  'Em Tráfego': { color: 'text-green-700', bg: 'bg-green-100', icon: Send, label: 'Em Tráfego' },
  'Finalizado': { color: 'text-teal-700', bg: 'bg-teal-100', icon: CheckCircle2, label: 'Finalizado' },
}

// Agrupar status para a visualização simplificada
const statusGroups = [
  { 
    key: 'pending', 
    label: 'Aguardando Aprovação', 
    statuses: ['Aprovação do Cliente'],
    color: 'border-amber-400',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    icon: Clock
  },
  { 
    key: 'production', 
    label: 'Em Produção', 
    statuses: ['Planejamento', 'Captação', 'Edição', 'Revisão', 'Legenda'],
    color: 'border-blue-400',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    icon: Play
  },
  { 
    key: 'scheduled', 
    label: 'Programados', 
    statuses: ['Programado'],
    color: 'border-cyan-400',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    icon: Calendar
  },
  { 
    key: 'published', 
    label: 'Publicados', 
    statuses: ['Publicado', 'Em Tráfego', 'Finalizado'],
    color: 'border-emerald-400',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    icon: CheckCircle2
  },
]

export function ProductionPipeline() {
  const { user } = useAuth()
  const [productions, setProductions] = useState<Production[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeGroup, setActiveGroup] = useState('pending')

  const [filters, setFilter, resetFilters] = usePersistedFilters('productions-filters', {
    search: '',
    filterClient: 'all',
    filterType: 'all',
    dateFrom: '',
    dateTo: '',
  })
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null)
  const [productionFiles, setProductionFiles] = useState<ProductionFile[]>([])
  const [isPending, startTransition] = useTransition()

  const loadData = () => {
    startTransition(async () => {
      const [productionsData, clientsData] = await Promise.all([
        getProductions({
          current_user_id: user?.id,
          current_user_role: user?.role
        }),
        getClients(),
      ])
      setProductions(productionsData)
      setClients(clientsData)
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

  const getProductionsByGroup = (groupKey: string) => {
    const group = statusGroups.find(g => g.key === groupKey)
    if (!group) return []
    return filteredProductions.filter(p => group.statuses.includes(p.status))
  }

  const handleStatusChange = async (production: Production, newStatus: string) => {
    try {
      await updateProductionStatus(production.id, newStatus)
      loadData()
    } catch (error) {
      console.error('[v0] Error updating status:', error)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short'
    })
  }

  const ContentCard = ({ production }: { production: Production }) => {
    const config = statusConfig[production.status] || statusConfig['Planejamento']
    const StatusIcon = config.icon
    
    return (
      <div
        onClick={() => setSelectedProduction(production)}
        className="group cursor-pointer rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200"
      >
        {/* Thumbnail */}
        <div className="aspect-square relative overflow-hidden rounded-t-xl bg-muted">
          {production.type === 'Vídeo' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <Video className="h-12 w-12 text-blue-500/40" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-500/10 to-orange-500/10">
              <ImageIcon className="h-12 w-12 text-pink-500/40" />
            </div>
          )}
          
          {/* Type Badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-[10px] font-medium bg-background/80 backdrop-blur-sm">
              {production.type}
            </Badge>
          </div>
          
          {/* Status Badge */}
          <div className="absolute bottom-2 right-2">
            <Badge className={cn('text-[10px] font-medium', config.bg, config.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <p className="font-medium text-sm truncate text-foreground">
            {production.client_name || 'Sem cliente'}
          </p>
          
          {production.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {production.notes}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[80px]">
                {production.responsible_name || 'Sem responsável'}
              </span>
            </div>
            {production.post_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(production.post_date)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const ContentListItem = ({ production }: { production: Production }) => {
    const config = statusConfig[production.status] || statusConfig['Planejamento']
    const StatusIcon = config.icon
    
    return (
      <div
        onClick={() => setSelectedProduction(production)}
        className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all duration-200"
      >
        {/* Thumbnail */}
        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
          {production.type === 'Vídeo' ? (
            <Video className="h-6 w-6 text-blue-500/60" />
          ) : (
            <ImageIcon className="h-6 w-6 text-pink-500/60" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate text-foreground">
              {production.client_name || 'Sem cliente'}
            </p>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {production.type}
            </Badge>
          </div>
          
          {production.notes && (
            <p className="text-xs text-muted-foreground truncate">
              {production.notes}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{production.responsible_name || 'Sem responsável'}</span>
            </div>
            {production.post_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(production.post_date)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <Badge className={cn('text-xs font-medium shrink-0', config.bg, config.color)}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conteúdos..."
                  value={filters.search}
                  onChange={(e) => setFilter('search', e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Select value={filters.filterClient} onValueChange={(v) => setFilter('filterClient', v)}>
                  <SelectTrigger className="w-[140px]">
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
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Vídeo">Vídeo</SelectItem>
                    <SelectItem value="Arte">Arte</SelectItem>
                  </SelectContent>
                </Select>

                {(filters.filterClient !== 'all' || filters.filterType !== 'all' || filters.search) && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
                    Limpar filtros
                  </Button>
                )}

                {isPending && <Loader2 className="h-4 w-4 animate-spin self-center" />}
              </div>
            </div>

            {/* View toggle and new button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <ProductionFormDialog onSuccess={loadData} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Groups Tabs */}
      <Tabs value={activeGroup} onValueChange={setActiveGroup} className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl overflow-x-auto">
          {statusGroups.map((group) => {
            const count = getProductionsByGroup(group.key).length
            const GroupIcon = group.icon
            return (
              <TabsTrigger
                key={group.key}
                value={group.key}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:shadow-sm transition-all",
                  "data-[state=active]:bg-background"
                )}
              >
                <GroupIcon className="h-4 w-4" />
                <span className="font-medium">{group.label}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {count}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {statusGroups.map((group) => {
          const groupProductions = getProductionsByGroup(group.key)
          
          return (
            <TabsContent key={group.key} value={group.key} className="mt-6">
              {groupProductions.length === 0 ? (
                <Card className={cn('border-2 border-dashed', group.color)}>
                  <CardContent className="py-12 text-center">
                    <div className={cn('inline-flex p-4 rounded-full mb-4', group.bgColor)}>
                      <group.icon className={cn('h-8 w-8', group.textColor)} />
                    </div>
                    <p className="text-muted-foreground">
                      Nenhum conteúdo {group.label.toLowerCase()}
                    </p>
                    <ProductionFormDialog 
                      onSuccess={loadData} 
                      trigger={
                        <Button variant="outline" size="sm" className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Criar novo conteúdo
                        </Button>
                      }
                    />
                  </CardContent>
                </Card>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {groupProductions.map((production) => (
                    <ContentCard key={production.id} production={production} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {groupProductions.map((production) => (
                    <ContentListItem key={production.id} production={production} />
                  ))}
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Production Details Sheet */}
      <Sheet open={selectedProduction !== null} onOpenChange={(open) => !open && setSelectedProduction(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2">
              {selectedProduction?.type === 'Vídeo' ? (
                <Video className="h-5 w-5 text-blue-500" />
              ) : (
                <ImageIcon className="h-5 w-5 text-pink-500" />
              )}
              <SheetTitle>{selectedProduction?.client_name || 'Detalhes'}</SheetTitle>
            </div>
          </SheetHeader>

          {selectedProduction && (
            <div className="mt-6 space-y-6">
              {/* Preview */}
              <div className="aspect-video rounded-xl bg-muted flex items-center justify-center">
                {selectedProduction.type === 'Vídeo' ? (
                  <div className="text-center">
                    <Video className="h-16 w-16 text-blue-500/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Preview do vídeo</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 text-pink-500/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Preview da arte</p>
                  </div>
                )}
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                  <Badge variant="outline">{selectedProduction.type}</Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge className={cn(
                    statusConfig[selectedProduction.status]?.bg,
                    statusConfig[selectedProduction.status]?.color
                  )}>
                    {selectedProduction.status}
                  </Badge>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                {selectedProduction.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Observações</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedProduction.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Responsável</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedProduction.responsible_name || 'Não atribuído'}</span>
                    </div>
                  </div>
                  
                  {selectedProduction.post_date && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Data</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(selectedProduction.post_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Change */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-3">Alterar Status</p>
                <div className="flex flex-wrap gap-2">
                  {PRODUCTION_STATUSES.map((status) => {
                    const config = statusConfig[status]
                    const isActive = selectedProduction.status === status
                    return (
                      <Button
                        key={status}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange(selectedProduction, status)}
                        className={cn(
                          'text-xs',
                          isActive && config?.bg,
                          isActive && config?.color
                        )}
                      >
                        {status}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Files */}
              <VideoUploadSection
                productionId={selectedProduction.id}
                files={productionFiles}
                onUpdate={() => loadFiles(selectedProduction.id)}
              />

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <DeleteDialog
                  title="Excluir Conteúdo"
                  description="Tem certeza que deseja excluir este conteúdo? Esta ação não pode ser desfeita."
                  onConfirm={() => deleteProduction(selectedProduction.id)}
                  onSuccess={() => {
                    setSelectedProduction(null)
                    loadData()
                  }}
                  trigger={
                    <Button variant="destructive" size="sm" className="flex-1">
                      Excluir
                    </Button>
                  }
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
