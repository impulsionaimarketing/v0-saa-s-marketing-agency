'use client'

import { useState, useEffect, useTransition } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MousePointer,
  DollarSign,
  TrendingUp,
  Calendar as CalendarIcon,
  RefreshCw,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  getClientMetrics,
  getCampaignMetrics,
  getAdsetMetrics,
  getAdMetrics,
  type ClientMetrics,
  type CampaignMetrics,
  type AdsetMetrics,
  type AdMetrics,
} from '@/lib/data/meta-ads-hierarchical'

type Level = 'client' | 'campaign' | 'adset' | 'ad'

interface BreadcrumbItem {
  label: string
  level: Level
}

export default function TrafegoPage() {
  // Navigation state
  const [level, setLevel] = useState<Level>('client')
  const [selectedClient, setSelectedClient] = useState<ClientMetrics | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignMetrics | null>(null)
  const [selectedAdset, setSelectedAdset] = useState<AdsetMetrics | null>(null)

  // Data state
  const [clientData, setClientData] = useState<ClientMetrics[]>([])
  const [campaignData, setCampaignData] = useState<CampaignMetrics[]>([])
  const [adsetData, setAdsetData] = useState<AdsetMetrics[]>([])
  const [adData, setAdData] = useState<AdMetrics[]>([])

  // Date range state - default to current month
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateData = async () => {
    setIsUpdating(true)
    try {
      // Chama a rota API interna que faz proxy para o n8n
      const response = await fetch('/api/update-meta-ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date_range: {
            start: dateRange.start,
            end: dateRange.end,
          },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Solicitação de atualização enviada! Os dados serão atualizados em breve.')
        // Recarrega os dados após 5 segundos
        setTimeout(() => {
          loadData()
        }, 5000)
      } else {
        toast.error(data.error || 'Erro ao solicitar atualização dos dados')
      }
    } catch (error) {
      console.error('[v0] Error triggering update:', error)
      toast.error('Erro ao conectar com o sistema de atualização')
    } finally {
      setIsUpdating(false)
    }
  }

  const [isPending, startTransition] = useTransition()

  // Load data based on current level
  useEffect(() => {
    loadData()
  }, [level, selectedClient, selectedCampaign, selectedAdset, dateRange])

  const loadData = () => {
    startTransition(async () => {
      try {
        if (level === 'client') {
          const data = await getClientMetrics(dateRange.start, dateRange.end)
          setClientData(data)
        } else if (level === 'campaign' && selectedClient) {
          const data = await getCampaignMetrics(selectedClient.client_id, dateRange.start, dateRange.end)
          setCampaignData(data)
        } else if (level === 'adset' && selectedCampaign) {
          const data = await getAdsetMetrics(selectedCampaign.campaign_id, dateRange.start, dateRange.end)
          setAdsetData(data)
        } else if (level === 'ad' && selectedAdset) {
          const data = await getAdMetrics(selectedAdset.adset_id, dateRange.start, dateRange.end)
          setAdData(data)
        }
      } catch (error) {
        console.error('[v0] Error loading data:', error)
      }
    })
  }

  // Calculate totals based on current level
  const calculateTotals = () => {
    let data: any[] = []
    
    if (level === 'client') data = clientData
    else if (level === 'campaign') data = campaignData
    else if (level === 'adset') data = adsetData
    else if (level === 'ad') data = adData

    return data.reduce(
      (acc, item) => ({
        spend: acc.spend + (item.total_spend || 0),
        impressions: acc.impressions + (item.total_impressions || 0),
        clicks: acc.clicks + (item.total_clicks || 0),
        reach: acc.reach + (item.total_reach || 0),
      }),
      { spend: 0, impressions: 0, clicks: 0, reach: 0 }
    )
  }

  const totals = calculateTotals()

  // Build breadcrumb
  const breadcrumb: BreadcrumbItem[] = [{ label: 'Clientes', level: 'client' }]
  if (selectedClient) {
    breadcrumb.push({ label: selectedClient.client_name, level: 'campaign' })
  }
  if (selectedCampaign) {
    breadcrumb.push({ label: selectedCampaign.campaign_name, level: 'adset' })
  }
  if (selectedAdset) {
    breadcrumb.push({ label: selectedAdset.adset_name, level: 'ad' })
  }

  // Navigation handlers
  const handleRowClick = (row: any) => {
    if (level === 'client') {
      setSelectedClient(row)
      setLevel('campaign')
    } else if (level === 'campaign') {
      setSelectedCampaign(row)
      setLevel('adset')
    } else if (level === 'adset') {
      setSelectedAdset(row)
      setLevel('ad')
    }
  }

  const handleBack = () => {
    if (level === 'campaign') {
      setSelectedClient(null)
      setLevel('client')
    } else if (level === 'adset') {
      setSelectedCampaign(null)
      setLevel('campaign')
    } else if (level === 'ad') {
      setSelectedAdset(null)
      setLevel('adset')
    }
  }

  const handleBreadcrumbClick = (targetLevel: Level) => {
    if (targetLevel === 'client') {
      setSelectedClient(null)
      setSelectedCampaign(null)
      setSelectedAdset(null)
      setLevel('client')
    } else if (targetLevel === 'campaign') {
      setSelectedCampaign(null)
      setSelectedAdset(null)
      setLevel('campaign')
    } else if (targetLevel === 'adset') {
      setSelectedAdset(null)
      setLevel('adset')
    }
  }

  // Format functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value))
  }

  const formatPercentage = (value: number) => {
    return value.toFixed(2) + '%'
  }

  // Get current data to display
  const getCurrentData = () => {
    if (level === 'client') return clientData
    if (level === 'campaign') return campaignData
    if (level === 'adset') return adsetData
    if (level === 'ad') return adData
    return []
  }

  const currentData = getCurrentData()

  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="campanhas" moduleDisplayName="Campanhas">
        <AppShell>
          <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold">Tráfego Pago - Facebook Ads</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Dashboard hierárquico de métricas de anúncios
                  </p>
                </div>
                <Button 
                  onClick={handleUpdateData}
                  disabled={isUpdating}
                  className="gap-2 w-full sm:w-auto"
                  variant="default"
                >
                  <RefreshCw className={cn("h-4 w-4", isUpdating && "animate-spin")} />
                  {isUpdating ? 'Atualizando...' : 'Atualizar Dados'}
                </Button>
              </div>

              {/* Date Range Selector */}
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1 flex-1 min-w-[150px]">
                  <label className="text-xs font-medium text-muted-foreground">Data Inicial</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          if (date) {
                            setStartDate(date)
                            setDateRange({ ...dateRange, start: format(date, 'yyyy-MM-dd') })
                          }
                        }}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1 flex-1 min-w-[150px]">
                  <label className="text-xs font-medium text-muted-foreground">Data Final</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          if (date) {
                            setEndDate(date)
                            setDateRange({ ...dateRange, end: format(date, 'yyyy-MM-dd') })
                          }
                        }}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Investimento Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{formatCurrency(totals.spend)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Alcance Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{formatNumber(totals.reach)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Impressões Totais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{formatNumber(totals.impressions)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cliques Totais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{formatNumber(totals.clicks)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Breadcrumb and Back Button */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {level !== 'client' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBack}
                      className="gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Voltar
                    </Button>
                  )}
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    {breadcrumb.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        <button
                          onClick={() => handleBreadcrumbClick(item.level)}
                          className={cn(
                            'hover:text-primary transition-colors',
                            index === breadcrumb.length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'
                          )}
                          disabled={index === breadcrumb.length - 1}
                        >
                          {item.label}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">
                  {level === 'client' && 'Clientes'}
                  {level === 'campaign' && `Campanhas - ${selectedClient?.client_name}`}
                  {level === 'adset' && `Conjuntos de Anúncios - ${selectedCampaign?.campaign_name}`}
                  {level === 'ad' && `Anúncios - ${selectedAdset?.adset_name}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPending ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-x-auto">
                    <Table className="min-w-[800px]">
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nome</TableHead>
                          {level === 'campaign' && (
                            <>
                              <TableHead>Objetivo</TableHead>
                              <TableHead>Status</TableHead>
                            </>
                          )}
                          <TableHead className="text-right">Alcance</TableHead>
                          <TableHead className="text-right">Impressões</TableHead>
                          <TableHead className="text-right">Cliques</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">Investimento</TableHead>
                          <TableHead className="text-right">CPC</TableHead>
                          <TableHead className="text-right">CPM</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentData.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={level === 'campaign' ? 10 : 8}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Nenhum dado disponível para o período selecionado
                            </TableCell>
                          </TableRow>
                        ) : (
                          currentData.map((row: any, index) => (
                            <TableRow
                              key={index}
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => level !== 'ad' && handleRowClick(row)}
                            >
                              <TableCell className="font-medium">
                                {level === 'client' && row.client_name}
                                {level === 'campaign' && row.campaign_name}
                                {level === 'adset' && row.adset_name}
                                {level === 'ad' && row.ad_name}
                              </TableCell>
                              {level === 'campaign' && (
                                <>
                                  <TableCell>
                                    <Badge variant="secondary" className="text-xs">
                                      {row.campaign_objective}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        'text-xs',
                                        row.campaign_status === 'ACTIVE' && 'bg-success/10 text-success border-success/20',
                                        row.campaign_status === 'PAUSED' && 'bg-warning/10 text-warning border-warning/20',
                                        row.campaign_status === 'ARCHIVED' && 'bg-muted text-muted-foreground border-muted'
                                      )}
                                    >
                                      {row.campaign_status}
                                    </Badge>
                                  </TableCell>
                                </>
                              )}
                              <TableCell className="text-right">{formatNumber(row.total_reach)}</TableCell>
                              <TableCell className="text-right">{formatNumber(row.total_impressions)}</TableCell>
                              <TableCell className="text-right">{formatNumber(row.total_clicks)}</TableCell>
                              <TableCell className="text-right text-blue-600 font-medium">
                                {formatPercentage(row.ctr)}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(row.total_spend)}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(row.cpc)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(row.cpm)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
