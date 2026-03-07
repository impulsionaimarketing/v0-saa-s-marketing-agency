'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppShell } from '@/components/layout/app-shell'
import { DashboardViewSelector } from '@/components/dashboard/dashboard-view-selector'
import { MetricsVisibilityModal } from '@/components/dashboard/metrics-visibility-modal'
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
import { Search, TrendingUp, TrendingDown, Minus, Eye, MousePointer, MessageSquare, DollarSign, Settings } from 'lucide-react'
import { campaigns, clients } from '@/lib/mock-data'
import { getDashboardViewsLocal, getDefaultDashboardViewLocal, createDashboardViewLocal } from '@/lib/data/dashboard-views'
import type { DashboardView } from '@/lib/types/dashboard'
import { cn } from '@/lib/utils'

const performanceColors = {
  green: 'bg-success/10 text-success border-success/20',
  yellow: 'bg-warning/10 text-warning border-warning/20',
  red: 'bg-destructive/10 text-destructive border-destructive/20',
}

const performanceIcons = {
  green: TrendingUp,
  yellow: Minus,
  red: TrendingDown,
}

const statusColors = {
  Ativo: 'bg-success/10 text-success border-success/20',
  Pausado: 'bg-warning/10 text-warning border-warning/20',
  Finalizado: 'bg-muted text-muted-foreground border-muted',
}

const METRICS_CONFIG = {
  investimento: { label: 'Investimento/dia', visible: true },
  impressoes: { label: 'Impressões', visible: true },
  cliques: { label: 'Cliques', visible: true },
  mensagens: { label: 'Mensagens', visible: true },
}

export default function TrafegoPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [performanceFilter, setPerformanceFilter] = useState<string>('all')
  const [views, setViews] = useState<DashboardView[]>([])
  const [activeViewId, setActiveViewId] = useState<string | undefined>()
  const [visibleMetrics, setVisibleMetrics] = useState(METRICS_CONFIG)
  const [isMounted, setIsMounted] = useState(false)
  const [filteredCampaigns, setFilteredCampaigns] = useState(campaigns)

  useEffect(() => {
    setIsMounted(true)
    const loadedViews = getDashboardViewsLocal('trafego')
    setViews(loadedViews)
    
    const defaultView = getDefaultDashboardViewLocal('trafego')
    if (defaultView) {
      setActiveViewId(defaultView.id)
      setVisibleMetrics(defaultView.metricsVisibility)
    }
  }, [])

  const handleSaveView = (name: string) => {
    const newView = createDashboardViewLocal({
      name,
      context: 'trafego',
      metricsVisibility: visibleMetrics,
      isDefault: views.length === 0,
    })
    setViews([...views, newView])
    setActiveViewId(newView.id)
  }

  const handleLoadView = (viewId: string) => {
    const view = views.find(v => v.id === viewId)
    if (view) {
      setActiveViewId(viewId)
      setVisibleMetrics(view.metricsVisibility)
    }
  }

  useEffect(() => {
    const filtered = campaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.clientName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesClient = clientFilter === 'all' || campaign.clientId === clientFilter
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
      const matchesPerformance = performanceFilter === 'all' || campaign.performance === performanceFilter
      return matchesSearch && matchesClient && matchesStatus && matchesPerformance
    })
    setFilteredCampaigns(filtered)
  }, [searchQuery, clientFilter, statusFilter, performanceFilter])

  // Calculate totals
  const totals = filteredCampaigns.reduce(
    (acc, campaign) => ({
      dailyBudget: acc.dailyBudget + campaign.dailyBudget,
      impressions: acc.impressions + campaign.impressions,
      clicks: acc.clicks + campaign.clicks,
      messages: acc.messages + campaign.messages,
    }),
    { dailyBudget: 0, impressions: 0, clicks: 0, messages: 0 }
  )

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Tráfego Pago</h1>
              <p className="text-muted-foreground">Acompanhe as campanhas de mídia paga</p>
            </div>
            <div className="flex gap-2">
              {isMounted && (
                <>
                  <DashboardViewSelector
                    context="trafego"
                    views={views}
                    activeViewId={activeViewId}
                    onViewSelect={handleLoadView}
                    onDeleteView={() => {}}
                    onSetDefault={() => {}}
                  />
                  <MetricsVisibilityModal
                    visibleMetrics={visibleMetrics}
                    metricsConfig={METRICS_CONFIG}
                    onMetricsChange={setVisibleMetrics}
                    onSaveView={handleSaveView}
                  />
                </>
              )}
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {visibleMetrics.investimento.visible && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Orçamento Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">R$ {totals.dailyBudget}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {visibleMetrics.impressoes.visible && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Impressões Totais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">{(totals.impressions / 1000).toFixed(1)}k</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {visibleMetrics.cliques.visible && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Cliques Totais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">{totals.clicks.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {visibleMetrics.mensagens.visible && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Mensagens Totais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold">{totals.messages}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Filters */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar campanha ou cliente..."
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
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 bg-secondary border-border">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos status</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Pausado">Pausado</SelectItem>
                      <SelectItem value="Finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                    <SelectTrigger className="w-36 bg-secondary border-border">
                      <SelectValue placeholder="Performance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="green">Bom</SelectItem>
                      <SelectItem value="yellow">Alerta</SelectItem>
                      <SelectItem value="red">Ruim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Campanhas ({filteredCampaigns.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Orç./dia</TableHead>
                    <TableHead className="text-right">Impressões</TableHead>
                    <TableHead className="text-right">Cliques</TableHead>
                    <TableHead className="text-right">Mensagens</TableHead>
                    <TableHead className="text-right">CPL</TableHead>
                    <TableHead className="text-right">CPA</TableHead>
                    <TableHead className="text-center">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => {
                    const PerformanceIcon = performanceIcons[campaign.performance]
                    return (
                      <TableRow key={campaign.id} className="border-border">
                        <TableCell className="font-medium">{campaign.clientName}</TableCell>
                        <TableCell>{campaign.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{campaign.objective}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(statusColors[campaign.status])}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">R$ {campaign.dailyBudget}</TableCell>
                        <TableCell className="text-right">{(campaign.impressions / 1000).toFixed(1)}k</TableCell>
                        <TableCell className="text-right">{campaign.clicks.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-right">{campaign.messages}</TableCell>
                        <TableCell className="text-right">R$ {campaign.cpl.toFixed(2)}</TableCell>
                        <TableCell className="text-right">R$ {campaign.cpa.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge variant="outline" className={cn('gap-1', performanceColors[campaign.performance])}>
                              <PerformanceIcon className="h-3 w-3" />
                              {campaign.performance === 'green' ? 'Bom' : campaign.performance === 'yellow' ? 'Alerta' : 'Ruim'}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <span className="text-muted-foreground">Indicadores de Performance:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-success text-xs">Dentro da meta</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10">
                    <Minus className="h-3 w-3 text-warning" />
                    <span className="text-warning text-xs">Alerta</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10">
                    <TrendingDown className="h-3 w-3 text-destructive" />
                    <span className="text-destructive text-xs">Fora da meta</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
