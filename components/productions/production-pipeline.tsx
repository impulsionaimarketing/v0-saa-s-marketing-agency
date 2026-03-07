'use client'

import { useState, useEffect, useTransition } from 'react'
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
  Search,
  Video,
  ImageIcon,
  Calendar,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
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
  const [productions, setProductions] = useState<Production[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [filterClient, setFilterClient] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [isPending, startTransition] = useTransition()

  const loadData = () => {
    startTransition(async () => {
      const [productionsData, clientsData] = await Promise.all([
        getProductions(),
        getClients(),
      ])
      setProductions(productionsData)
      setClients(clientsData)
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredProductions = productions.filter((production) => {
    const matchesSearch =
      search === '' ||
      production.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      production.notes?.toLowerCase().includes(search.toLowerCase())
    const matchesClient =
      filterClient === 'all' || production.client_id === filterClient
    const matchesType = filterType === 'all' || production.type === filterType
    return matchesSearch && matchesClient && matchesType
  })

  const getProductionsByStatus = (status: string) => {
    return filteredProductions.filter((p) => p.status === status)
  }

  const handleMoveStatus = async (production: Production, direction: 'next' | 'prev') => {
    const currentIndex = PRODUCTION_STATUSES.indexOf(production.status as typeof PRODUCTION_STATUSES[number])
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    
    if (newIndex >= 0 && newIndex < PRODUCTION_STATUSES.length) {
      const newStatus = PRODUCTION_STATUSES[newIndex]
      await updateProductionStatus(production.id, newStatus)
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar criativos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Vídeo">Vídeo</SelectItem>
                <SelectItem value="Arte">Arte</SelectItem>
              </SelectContent>
            </Select>

            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}

            <ProductionFormDialog onSuccess={loadData} />
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
              <CardContent className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
                {getProductionsByStatus(status).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum criativo
                  </p>
                ) : (
                  getProductionsByStatus(status).map((production) => (
                    <Card
                      key={production.id}
                      className="bg-secondary/50 border-border p-3"
                    >
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

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                              {new Date(production.post_date).toLocaleDateString(
                                'pt-BR',
                                { day: '2-digit', month: '2-digit' }
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={statusIndex === 0}
                            onClick={() => handleMoveStatus(production, 'prev')}
                            title="Mover para anterior"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={statusIndex === PRODUCTION_STATUSES.length - 1}
                            onClick={() => handleMoveStatus(production, 'next')}
                            title="Mover para próximo"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <DeleteDialog
                          title="Excluir Criativo"
                          description="Tem certeza que deseja excluir este criativo? Esta ação não pode ser desfeita."
                          onConfirm={() => deleteProduction(production.id)}
                          onSuccess={loadData}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
