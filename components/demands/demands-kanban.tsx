'use client'

import React, { useState, useEffect, useMemo, useTransition } from 'react'
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
import { Search, Calendar, User, GripVertical, Loader2, Pencil, Trash2 } from 'lucide-react'
import { getDemands, updateDemandStatus, deleteDemand, type Demand } from '@/lib/data/demands'
import { getClients } from '@/lib/data/clients'
import { getUsers } from '@/lib/data/users'
import { DemandFormDialog } from './demand-form-dialog'
import { DeleteDialog } from '@/components/shared/delete-dialog'
import { cn } from '@/lib/utils'

type DemandStatus = Demand['status']

const columns: { id: DemandStatus; title: string; color: string }[] = [
  { id: 'A Fazer', title: 'A Fazer', color: 'bg-muted' },
  { id: 'Em Produção', title: 'Em Produção', color: 'bg-chart-2' },
  { id: 'Em Revisão', title: 'Em Revisão', color: 'bg-warning' },
  { id: 'Aprovado', title: 'Aprovado', color: 'bg-primary' },
  { id: 'Publicado', title: 'Publicado', color: 'bg-success' },
  { id: 'Atrasado', title: 'Atrasado', color: 'bg-destructive' },
]

const areaColors: Record<string, string> = {
  'Arte': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  'Vídeo': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  'Tráfego': 'bg-primary/10 text-primary border-primary/20',
  'Comunicação': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
}

export function DemandsKanban() {
  const [demandItems, setDemandItems] = useState<Demand[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all')
  const [draggedItem, setDraggedItem] = useState<Demand | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [demandsData, clientsData, usersData] = await Promise.all([
        getDemands(),
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

  const filteredDemands = useMemo(() => {
    return demandItems.filter((demand) => {
      const matchesSearch = demand.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesClient = clientFilter === 'all' || demand.client_id === clientFilter
      const matchesArea = areaFilter === 'all' || demand.area === areaFilter
      const matchesResponsible = responsibleFilter === 'all' || demand.responsible_id === responsibleFilter
      return matchesSearch && matchesClient && matchesArea && matchesResponsible
    })
  }, [demandItems, searchQuery, clientFilter, areaFilter, responsibleFilter])

  const getColumnDemands = (status: DemandStatus) => {
    return filteredDemands.filter((d) => d.status === status)
  }

  const handleDragStart = (e: React.DragEvent, demand: Demand) => {
    setDraggedItem(demand)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, newStatus: DemandStatus) => {
    e.preventDefault()
    if (draggedItem && draggedItem.status !== newStatus) {
      // Optimistic update
      setDemandItems((prev) =>
        prev.map((d) =>
          d.id === draggedItem.id ? { ...d, status: newStatus } : d
        )
      )
      
      // Update in database
      startTransition(async () => {
        try {
          await updateDemandStatus(draggedItem.id, newStatus)
        } catch (error) {
          console.error('[v0] Error updating demand status:', error)
          // Revert on error
          loadData()
        }
      })
    }
    setDraggedItem(null)
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
      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar demanda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-40 bg-secondary border-border">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-36 bg-secondary border-border">
                  <SelectValue placeholder="Área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas áreas</SelectItem>
                  <SelectItem value="Arte">Arte</SelectItem>
                  <SelectItem value="Vídeo">Vídeo</SelectItem>
                  <SelectItem value="Tráfego">Tráfego</SelectItem>
                  <SelectItem value="Comunicação">Comunicação</SelectItem>
                </SelectContent>
              </Select>
              <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                <SelectTrigger className="w-40 bg-secondary border-border">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isPending && <Loader2 className="h-4 w-4 animate-spin self-center" />}
              <DemandFormDialog onSuccess={loadData} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnDemands = getColumnDemands(column.id)
          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-72"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={cn('h-3 w-3 rounded-full', column.color)} />
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {columnDemands.length}
                </Badge>
              </div>

              {/* Column content */}
              <div className="space-y-3 min-h-[400px] rounded-lg bg-secondary/30 p-2">
                {columnDemands.map((demand) => (
                  <Card
                    key={demand.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, demand)}
                    className={cn(
                      'bg-card border-border cursor-grab active:cursor-grabbing transition-all hover:border-primary/50',
                      draggedItem?.id === demand.id && 'opacity-50'
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-tight">{demand.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{demand.client_name}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
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
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(demand.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                            <DemandFormDialog
                              demand={demand}
                              onSuccess={loadData}
                              trigger={
                                <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary">
                                  <Pencil className="h-3 w-3" />
                                  Editar
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
    </>
  )
}
