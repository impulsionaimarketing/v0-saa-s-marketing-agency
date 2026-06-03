'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  PlusCircle, 
  Search, 
  Video, 
  Image as ImageIcon, 
  Calendar, 
  LayoutGrid, 
  Columns3, 
  List,
  Filter
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { FeedView, KanbanView, CalendarView, ListView } from '@/components/productions/views'
import { ProductionDetailDrawer } from '@/components/productions/production-detail-drawer'
import { useAuth } from '@/lib/hooks/use-auth'
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

type ViewMode = 'feed' | 'kanban' | 'calendar' | 'list'

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

  useEffect(() => {
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
      
      // Update selected production if open
      if (selectedProduction?.id === id) {
        setSelectedProduction(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err)
    }
  }

  const handleSelectProduction = (production: Production) => {
    setSelectedProduction(production)
    setDrawerOpen(true)
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

  // Get unique clients from productions for filter
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
              
              <Button asChild className="gap-2">
                <Link href="/producao/aprovacao">
                  <PlusCircle className="h-4 w-4" />
                  Nova Produção
                </Link>
              </Button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conteúdos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-background border-border"
                />
              </div>

              {/* Client Filter */}
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

              {/* Status Filter */}
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

              {/* Type Filter */}
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
              </TabsList>
            </Tabs>

            {/* Content Views */}
            <div className="min-h-[400px]">
              {viewMode === 'feed' && (
                <FeedView
                  productions={filteredProductions}
                  onSelect={handleSelectProduction}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}
              {viewMode === 'kanban' && (
                <KanbanView
                  productions={filteredProductions}
                  onSelect={handleSelectProduction}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}
              {viewMode === 'calendar' && (
                <CalendarView
                  productions={filteredProductions}
                  onSelect={handleSelectProduction}
                />
              )}
              {viewMode === 'list' && (
                <ListView
                  productions={filteredProductions}
                  onSelect={handleSelectProduction}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}
            </div>
          </div>

          {/* Detail Drawer */}
          <ProductionDetailDrawer
            production={selectedProduction}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onUpdateStatus={handleUpdateStatus}
          />
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
