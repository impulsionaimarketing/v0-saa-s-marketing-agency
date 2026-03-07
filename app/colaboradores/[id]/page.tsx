'use client'

import { use } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, ClipboardList, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { collaborators, demands, productions } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const areaColors: Record<string, string> = {
  'Arte': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  'Vídeo': 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  'Tráfego': 'bg-primary/10 text-primary border-primary/20',
  'Comunicação': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
}

const demandStatusColors: Record<string, string> = {
  'A Fazer': 'bg-muted text-muted-foreground',
  'Em Produção': 'bg-chart-2/10 text-chart-2',
  'Em Revisão': 'bg-warning/10 text-warning',
  'Aprovado': 'bg-primary/10 text-primary',
  'Publicado': 'bg-success/10 text-success',
  'Atrasado': 'bg-destructive/10 text-destructive',
}

export default function ColaboradorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const collaborator = collaborators.find((c) => c.id === id)

  if (!collaborator) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-muted-foreground">Colaborador não encontrado</p>
          <Link href="/colaboradores">
            <Button variant="link">Voltar para colaboradores</Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  const collaboratorDemands = demands.filter((d) => d.responsible === collaborator.name)
  const collaboratorProductions = productions.filter((p) => p.responsible === collaborator.name)

  const completedDemands = collaboratorDemands.filter(d => d.status === 'Publicado').length
  const inProgressDemands = collaboratorDemands.filter(d => d.status === 'Em Produção').length
  const lateDemands = collaboratorDemands.filter(d => d.status === 'Atrasado').length

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/colaboradores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4 flex-1">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
              {collaborator.avatar}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{collaborator.name}</h1>
                <Badge variant="outline" className={cn(
                  collaborator.status === 'Ativo' 
                    ? 'bg-success/10 text-success border-success/20' 
                    : 'bg-muted text-muted-foreground'
                )}>
                  {collaborator.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{collaborator.role}</span>
                <span className="text-muted-foreground">•</span>
                <div className="flex flex-wrap gap-2">
                  {collaborator.areas.map((area) => (
                    <Badge key={area} variant="outline" className={cn(areaColors[area])}>
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Demandas</p>
                  <p className="text-xl font-bold">{collaboratorDemands.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                  <Clock className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Em Andamento</p>
                  <p className="text-xl font-bold">{inProgressDemands}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Finalizadas</p>
                  <p className="text-xl font-bold">{completedDemands}</p>
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
                  <p className="text-xs text-muted-foreground">Atrasadas</p>
                  <p className="text-xl font-bold">{lateDemands}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demands table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Demandas Atribuídas</CardTitle>
            <CardDescription>Todas as demandas atribuídas a este colaborador</CardDescription>
          </CardHeader>
          <CardContent>
            {collaboratorDemands.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Demanda</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaboratorDemands.map((demand) => (
                    <TableRow key={demand.id} className="border-border">
                      <TableCell className="font-medium">{demand.name}</TableCell>
                      <TableCell>{demand.clientName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{demand.area}</Badge>
                      </TableCell>
                      <TableCell>{new Date(demand.deadline).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge className={cn(demandStatusColors[demand.status])}>
                          {demand.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Nenhuma demanda atribuída
              </div>
            )}
          </CardContent>
        </Card>

        {/* Productions table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Produção de Conteúdo</CardTitle>
            <CardDescription>Criativos em produção por este colaborador</CardDescription>
          </CardHeader>
          <CardContent>
            {collaboratorProductions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data Prevista</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaboratorProductions.map((production) => (
                    <TableRow key={production.id} className="border-border">
                      <TableCell className="font-medium">{production.clientName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{production.type}</Badge>
                      </TableCell>
                      <TableCell>{new Date(production.postDate).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{production.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Nenhuma produção atribuída
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
