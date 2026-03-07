'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Eye, Loader2, Pencil, Trash2 } from 'lucide-react'
import { getClients, deleteClient, type Client } from '@/lib/data/clients'
import { ClientFormDialog } from './client-form-dialog'
import { DeleteDialog } from '@/components/shared/delete-dialog'
import { cn } from '@/lib/utils'

const statusColors = {
  Ativo: 'bg-success/10 text-success border-success/20',
  Pausado: 'bg-warning/10 text-warning border-warning/20',
  Perdido: 'bg-destructive/10 text-destructive border-destructive/20',
}

const monthStatusColors = {
  green: 'bg-success',
  yellow: 'bg-warning',
  red: 'bg-destructive',
}

export function ClientsTable() {
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadClients()
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, statusFilter])

  async function loadClients() {
    startTransition(async () => {
      try {
        const data = await getClients({
          status: statusFilter,
          search: searchQuery,
        })
        setClients(data)
      } catch (error) {
        console.error('[v0] Error loading clients:', error)
      } finally {
        setIsLoading(false)
      }
    })
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-auto md:w-48 bg-secondary border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Pausado">Pausado</SelectItem>
                <SelectItem value="Perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients table */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 sm:p-6">
          <CardTitle className="text-lg flex items-center gap-2">
            Clientes ({clients.length})
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <ClientFormDialog onSuccess={loadClients} />
        </CardHeader>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="min-w-32">Empresa</TableHead>
                    <TableHead className="min-w-28">Status</TableHead>
                    <TableHead className="min-w-20">Plano</TableHead>
                    <TableHead className="text-right min-w-28">Valor</TableHead>
                    <TableHead className="min-w-28">Frequência</TableHead>
                    <TableHead className="min-w-24">Vencimento</TableHead>
                    <TableHead className="text-center min-w-16">Mês</TableHead>
                    <TableHead className="text-right min-w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="border-border">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(statusColors[client.contract_status])} size="sm">
                          {client.contract_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" size="sm">{client.plan}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        R$ {Number(client.monthly_value).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" size="sm">{client.payment_frequency || 'Mensal'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {client.renewal_date ? new Date(client.renewal_date).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <div className={cn('h-3 w-3 rounded-full', monthStatusColors[client.month_status])} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/clientes/${client.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <ClientFormDialog
                            client={client}
                            onSuccess={loadClients}
                            trigger={
                              <Button variant="ghost" size="sm">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DeleteDialog
                            title="Excluir Cliente"
                            description={`Tem certeza que deseja excluir "${client.name}"? Esta ação não pode ser desfeita.`}
                            onConfirm={() => deleteClient(client.id)}
                            onSuccess={loadClients}
                            trigger={
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
