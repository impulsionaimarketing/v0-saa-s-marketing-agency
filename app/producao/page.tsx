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
import { PlusCircle, Search, Video, ImageIcon, Calendar, User } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { ProductionCard, ProductionCardSkeleton } from '@/components/productions/production-card'
import { useAuth } from '@/lib/hooks/use-auth'

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

const STATUS_LIST = [
  'Planejamento',
  'Aprovação do Cliente',
  'Captação',
  'Edição',
  'Revisão',
  'Legenda',
  'Programado',
  'Publicado',
  'Em Tráfego',
  'Finalizado'
]

const STATUS_COLORS: Record<string, string> = {
  'Planejamento': 'bg-yellow-500',
  'Aprovação do Cliente': 'bg-blue-500',
  'Captação': 'bg-orange-500',
  'Edição': 'bg-purple-500',
  'Revisão': 'bg-red-500',
  'Legenda': 'bg-green-500',
  'Programado': 'bg-gray-500',
  'Publicado': 'bg-emerald-500',
  'Em Tráfego': 'bg-indigo-500',
  'Finalizado': 'bg-slate-500',
}

export default function ProducaoPage() {
  const { user } = useAuth()
  const [productions, setProductions] = useState<Production[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    const fetchProductions = async () => {
      try {
        const res = await fetch('/api/productions')
        if (!res.ok) throw new Error('Falha ao carregar produções')
        const data = await res.json()
        setProductions(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProductions()
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
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err)
      alert('Erro ao atualizar status: ' + err.message)
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
    return matchesSearch && matchesStatus && matchesType
  })

  // Count productions by status
  const statusCounts = STATUS_LIST.reduce((acc, status) => {
    acc[status] = productions.filter(p => p.status === status).length
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <ProtectedRoute>
        <ModuleAccessWrapper moduleName="producoes" moduleDisplayName="Produções">
          <AppShell>
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Produção de Conteúdo</h1>
                <p className="text-muted-foreground">Visualize e gerencie seus criativos</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <ProductionCardSkeleton key={i} />
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
            <div className="p-4 text-red-600">Erro: {error}</div>
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
            {/* Page header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold">Produção de Conteúdo</h1>
                <p className="text-muted-foreground">Visualize e gerencie seus criativos</p>
              </div>
              <Button asChild className="gap-2">
                <Link href="/producao/aprovacao">
                  <PlusCircle className="h-4 w-4" />
                  Nova Produção
                </Link>
              </Button>
            </div>

            {/* Status summary badges */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => setFilterStatus('all')}
              >
                Todos ({productions.length})
              </Badge>
              {STATUS_LIST.map((status) => (
                statusCounts[status] > 0 && (
                  <Badge
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    className={`cursor-pointer px-3 py-1.5 ${filterStatus === status ? STATUS_COLORS[status] : ''}`}
                    onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                  >
                    <span className={`w-2 h-2 rounded-full mr-2 ${STATUS_COLORS[status]}`} />
                    {status} ({statusCounts[status]})
                  </Badge>
                )
              ))}
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar criativos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
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

            {/* Production Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProductions.map((prod) => (
                <ProductionCard
                  key={prod.id}
                  production={prod}
                  onUpdateStatus={handleUpdateStatus}
                  isLoading={false}
                />
              ))}
            </div>

            {filteredProductions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {productions.length === 0
                  ? 'Nenhuma produção encontrada.'
                  : 'Nenhum criativo encontrado com os filtros aplicados.'}
              </div>
            )}
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
