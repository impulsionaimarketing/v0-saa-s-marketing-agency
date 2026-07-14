'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  PlusCircle, 
  Search, 
  Video, 
  Image as ImageIcon, 
  Calendar, 
  LayoutGrid, 
  Columns3, 
  List,
  CheckSquare,
  X,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  Trash2,
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { FeedView, KanbanView, CalendarView, ListView, ChangesView } from '@/components/productions/views'
import { ProductionDetailDrawer } from '@/components/productions/production-detail-drawer'
import { ProductionFormDialog } from '@/components/productions/production-form-dialog'
import { useAuth } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'

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

interface Client {
  id: string
  name: string
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

type ViewMode = 'feed' | 'kanban' | 'calendar' | 'list' | 'changes'

export default function ProducaoPage() {
  const { user } = useAuth()
  const [productions, setProductions] = useState<Production[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterClient, setFilterClient] = useState('all')
  
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('feed')
  
  // Detail drawer
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Edit dialog
  const [editingProduction, setEditingProduction] = useState<Production | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isGeneratingBulkLink, setIsGeneratingBulkLink] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = async () => {
    try {
      const [productionsRes, clientsRes] = await Promise.all([
        fetch('/api/productions'),
        fetch('/api/clients/search?q=')
      ])

      if (!productionsRes.ok) throw new Error('Falha ao carregar produções')
      const productionsData = await productionsRes.json()
      setProductions(productionsData)

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(clientsData)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/productions/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar status')
      setProductions(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
      if (selectedProduction?.id === id) {
        setSelectedProduction(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  const handleSelectProduction = (production: Production) => {
    if (selectionMode) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(production.id)) {
          next.delete(production.id)
        } else {
          next.add(production.id)
        }
        return next
      })
      return
    }
    setSelectedProduction(production)
    setDrawerOpen(true)
  }

  const handleEditProduction = (production: Production) => {
    setEditingProduction(production)
    setEditOpen(true)
  }

  const handleExitSelection = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  const handleGenerateBulkLink = async () => {
    if (selectedIds.size === 0) return
    setIsGeneratingBulkLink(true)
    try {
      const res = await fetch('/api/approval/generate-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionIds: Array.from(selectedIds) }),
      })
      const json = await res.json()
      if (json.url) {
        await navigator.clipboard.writeText(json.url)
        toast.success('Link copiado! Envie para o cliente.')
        handleExitSelection()
      } else {
        toast.error('Erro ao gerar link.')
      }
    } catch {
      toast.error('Erro ao gerar link.')
    } finally {
      setIsGeneratingBulkLink(false)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    setIsDeleting(true)
    const ids = Array.from(selectedIds)
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/productions/${id}`, { method: 'DELETE' }).then((res) => {
            if (!res.ok) throw new Error('Falha ao excluir')
            return id
          })
        )
      )

      const deletedIds = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map((r) => r.value)
      const failedCount = results.length - deletedIds.length

      if (deletedIds.length > 0) {
        const deletedSet = new Set(deletedIds)
        setProductions((prev) => prev.filter((p) => !deletedSet.has(p.id)))
        toast.success(
          deletedIds.length === 1
            ? 'Produção excluída!'
            : `${deletedIds.length} produções excluídas!`
        )
      }
      if (failedCount > 0) {
        toast.error(`Erro ao excluir ${failedCount} produção${failedCount > 1 ? 'ões' : ''}`)
      }

      handleExitSelection()
    } catch {
      toast.error('Erro ao excluir produções.')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const filteredProductions = productions.filter((prod) => {
    const matchesSearch =
      search === '' ||
      prod.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      prod.notes?.toLowerCase().includes(search.toLowerCase()) ||
      prod.title?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || prod.status === filterStatus
    const matchesType = filterType === 'all' || prod.type === filterType
    const matchesClient = filterClient === 'all' || prod.client_id === filterClient
    return matchesSearch && matchesStatus && matchesType && matchesClient
  })

  const productionClients = Array.from(
    new Map(
      productions
        .filter(p => p.client_id && p.client_name)
        .map(p => [p.client_id, { id: p.client_id, name: p.client_name! }])
    ).values()
  )

  if (loading) {
    return (
      <ProtectedRoute>
        <ModuleAccessWrapper moduleName="producoes" moduleDisplayName="Produções">
          <AppShell>
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-96" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-full max-w-xs" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            </div>
          </AppShell>
        </ModuleAccessWrapper>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <ModuleAccessWrapper moduleName="producoes" moduleDisplayName="Produções">
          <AppShell>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <span className="text-destructive text-2xl">!</span>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">Erro ao carregar</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </AppShell>
        </ModuleAccessWrapper>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="producoes" moduleDisplayName="Produções">
        <AppShell>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Produção de Conteúdo</h1>
                <p className="text-muted-foreground mt-1">
                  Planeje, produza e aprove conteúdos dos seus clientes.
                </p>
              </div>
              
              <div className="flex gap-2">
                {!selectionMode ? (
                  <>
                    <Button variant="outline" className="gap-2" onClick={() => setSelectionMode(true)}>
                      <CheckSquare className="h-4 w-4" />
                      Selecionar
                    </Button>
                    <Button asChild className="gap-2">
                      <Link href="/producao/aprovacao">
                        <PlusCircle className="h-4 w-4" />
                        Nova Produção
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="gap-2" onClick={handleExitSelection}>
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-2"
                      disabled={selectedIds.size === 0 || isDeleting}
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {selectedIds.size > 0 ? `Excluir (${selectedIds.size})` : 'Excluir'}
                    </Button>
                    <Button
                      className="gap-2"
                      disabled={selectedIds.size === 0 || isGeneratingBulkLink}
                      onClick={handleGenerateBulkLink}
                    >
                      {isGeneratingBulkLink ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LinkIcon className="h-4 w-4" />
                      )}
                      {selectedIds.size > 0
                        ? `Gerar Link (${selectedIds.size})`
                        : 'Selecione itens'}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Selection info bar */}
            {selectionMode && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary">
                <CheckSquare className="h-4 w-4" />
                {selectedIds.size === 0
                  ? 'Clique nas produções para selecioná-las'
                  : `${selectedIds.size} produção${selectedIds.size > 1 ? 'ões' : ''} selecionada${selectedIds.size > 1 ? 's' : ''}`}
              </div>
            )}

            {/* Filters Row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conteúdos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-background border-border"
                />
              </div>

              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="w-full sm:w-44 bg-background border-border">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {productionClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-44 bg-background border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-36 bg-background border-border">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Vídeo">
                    <span className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Vídeo
                    </span>
                  </SelectItem>
                  <SelectItem value="Arte">
                    <span className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Arte
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Tabs */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="feed" className="gap-2 data-[state=active]:bg-background">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Feed</span>
                </TabsTrigger>
                <TabsTrigger value="kanban" className="gap-2 data-[state=active]:bg-background">
                  <Columns3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Kanban</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2 data-[state=active]:bg-background">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendário</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2 data-[state=active]:bg-background">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Lista</span>
                </TabsTrigger>
                <TabsTrigger value="changes" className="gap-2 data-[state=active]:bg-background">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Alterações</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Content Views */}
            <div className="min-h-[400px]">
              {viewMode === 'feed' && (
                <FeedView
                  productions={filteredProductions}
                  onSelect={handleSelectProduction}
                  onEdit={handleEditProduction}
                  onUpdateStatus={handleUpdateStatus}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                />
              )}
              {viewMode === 'kanban' && (
                <KanbanView
                  productions={filteredProductions}
                  onSelect={handleSelectProduction}
                  onUpdateStatus={handleUpdateStatus}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                />
              )}
              {viewMode === 'calendar' && (
                <CalendarView
                  productions={filteredProductions}
                  onSelect={handleSelectProduction}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                />
              )}
              {viewMode === 'list' && (
                <ListView
                  productions={filteredProductions}
                  onSelect={handleSelectProduction}
                  onUpdateStatus={handleUpdateStatus}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                />
              )}
              {viewMode === 'changes' && (
                <ChangesView
                  onSelectById={(id) => {
                    const prod = productions.find((p) => p.id === id)
                    if (prod) {
                      setSelectedProduction(prod)
                      setDrawerOpen(true)
                    }
                  }}
                />
              )}
            </div>
          </div>

          <ProductionDetailDrawer
            production={selectedProduction}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onUpdateStatus={handleUpdateStatus}
            onUpdated={() => {
              setDrawerOpen(false)
              fetchData()
            }}
          />

          <ProductionFormDialog
            production={editingProduction}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={() => {
              setEditOpen(false)
              setEditingProduction(null)
              fetchData()
            }}
          />

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Excluir {selectedIds.size > 1 ? `${selectedIds.size} produções` : 'produção'}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. {selectedIds.size > 1 ? 'As produções serão removidas' : 'A produção será removida'} permanentemente,
                  incluindo todos os arquivos de mídia armazenados no MinIO.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleDeleteSelected()
                  }}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Excluindo...
                    </span>
                  ) : (
                    'Excluir'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
