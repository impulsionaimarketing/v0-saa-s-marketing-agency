'use client'

import { useState, useEffect } from 'react'
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
import { Search, Eye, Users, AlertCircle, CheckCircle, Loader2, Pencil, Trash2 } from 'lucide-react'
import { getUsers, deleteUser, type User } from '@/lib/data/users'
import { CollaboratorFormDialog } from './collaborator-form-dialog'
import { DeleteDialog } from '@/components/shared/delete-dialog'
import { cn } from '@/lib/utils'

const areaColors: Record<string, string> = {
  'Arte': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  'Vídeo': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  'Tráfego': 'bg-primary/10 text-primary border-primary/20',
  'Comunicação': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
}

const statusColors = {
  Ativo: 'bg-success/10 text-success border-success/20',
  Inativo: 'bg-muted text-muted-foreground border-muted',
}

const roleLabels = {
  Admin: 'Administrador',
  Gestor: 'Gestor',
  Colaborador: 'Colaborador',
}

export function CollaboratorsTable() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadUsers()
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, areaFilter, statusFilter])

  async function loadUsers() {
    setIsLoading(true)
    try {
      const data = await getUsers({
        area: areaFilter !== 'all' ? areaFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery,
      })
      setUsers(data)
    } catch (error) {
      console.error('[v0] Error loading users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const activeCount = users.filter((u) => u.status === 'Ativo').length

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
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
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Colaboradores Ativos</p>
                <p className="text-xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <CheckCircle className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de Colaboradores</p>
                <p className="text-xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Inativos</p>
                <p className="text-xl font-bold">{users.length - activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-full sm:w-auto md:w-40 bg-secondary border-border text-sm">
                  <SelectValue placeholder="Área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as áreas</SelectItem>
                  <SelectItem value="Arte">Arte</SelectItem>
                  <SelectItem value="Vídeo">Vídeo</SelectItem>
                  <SelectItem value="Tráfego">Tráfego</SelectItem>
                  <SelectItem value="Comunicação">Comunicação</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-auto md:w-40 bg-secondary border-border text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collaborators table */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 sm:p-6">
          <CardTitle className="text-lg flex items-center gap-2">
            Colaboradores ({users.length})
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <CollaboratorFormDialog onSuccess={loadUsers} />
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum colaborador encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="min-w-32">Nome</TableHead>
                    <TableHead className="min-w-28">Email</TableHead>
                    <TableHead className="min-w-24">Função</TableHead>
                    <TableHead className="min-w-28">Área</TableHead>
                    <TableHead className="min-w-20">Status</TableHead>
                    <TableHead className="text-right min-w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-border">
                      <TableCell className="font-medium text-sm">{user.name}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" size="sm" className="text-xs">
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(areaColors[user.area] || areaColors['Arte'])} size="sm">
                          <span className="text-xs">{user.area}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {user.status === 'Ativo' ? (
                            <CheckCircle className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-muted" />
                          )}
                          <Badge variant="outline" className={cn(statusColors[user.status])} size="sm">
                            <span className="text-xs">{user.status}</span>
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <CollaboratorFormDialog
                            user={user}
                            onSuccess={loadUsers}
                            trigger={
                              <Button variant="ghost" size="sm">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DeleteDialog
                            title="Excluir Colaborador"
                            description={`Tem certeza que deseja excluir "${user.name}"? Esta ação não pode ser desfeita.`}
                            onConfirm={() => deleteUser(user.id)}
                            onSuccess={loadUsers}
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

      {/* Collaborators table */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Equipe ({users.length})</CardTitle>
          <CollaboratorFormDialog onSuccess={loadUsers} />
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum colaborador encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {getInitials(user.name)}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabels[user.role]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.area ? (
                          <Badge variant="outline" className={cn(areaColors[user.area])}>
                            {user.area}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(statusColors[user.status])}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/colaboradores/${user.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <CollaboratorFormDialog
                          user={user}
                          onSuccess={loadUsers}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DeleteDialog
                          title="Excluir Colaborador"
                          description={`Tem certeza que deseja excluir "${user.name}"? Esta ação não pode ser desfeita.`}
                          onConfirm={() => deleteUser(user.id)}
                          onSuccess={loadUsers}
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
          )}
        </CardContent>
      </Card>
    </>
  )
}
