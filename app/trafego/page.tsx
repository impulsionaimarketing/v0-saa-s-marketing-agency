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
  Target,
  AlertTriangle,
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
  getAdsSyncInfo,
  type PlatformFilter,
  type AdsSyncInfo,
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
  const [platform, setPlatform] = useState<PlatformFilter>('all')
  const [preset, setPreset] = useState<'hoje' | '7d' | '30d' | 'mes' | 'custom'>('30d')
  const [sortKey, setSortKey] = useState<'spend' | 'results' | 'cpr'>('spend')

  const applyPreset = (value: 'hoje' | '7d' | '30d' | 'mes' | 'custom') => {
    setPreset(value)
    if (value === 'custom') return
    const end = new Date()
    const start = new Date()
    if (value === '7d') start.setDate(end.getDate() - 6)
    else if (value === '30d') start.setDate(end.getDate() - 29)
    else if (value === 'mes') start.setDate(1)
    setStartDate(start)
    setEndDate(end)
    setDateRange({ start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') })
  }
  const [syncInfo, setSyncInfo] = useState<AdsSyncInfo>({ lastOkAt: null, errors: [] })

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
          platform: platform === 'all' ? undefined : platform,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Solicitação de atualização enviada! Os dados serão atualizados em breve.')
        // Recarrega os dados após 5 segundos
        setTimeout(() => {
          loadData()
        }, 8000)
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
  }, [level, selectedClient, selectedCampaign, selectedAdset, dateRange, platform])

  const loadData = () => {
    startTransition(async () => {
      try {
        if (level === 'client') {
          const data = await getClientMetrics(dateRange.start, dateRange.end, platform)
          setClientData(data)
        } else if (level === 'campaign' && selectedClient) {
          const data = await getCampaignMetrics(selectedClient.client_id, dateRange.start, dateRange.end, platform)
          setCampaignData(data)
        } else if (level === 'adset' && selectedCampaign) {
          const data = await getAdsetMetrics(selectedCampaign.campaign_id, dateRange.start, dateRange.end, platform)
          setAdsetData(data)
        } else if (level === 'ad' && selectedAdset) {
          const data = await getAdMetrics(selectedAdset.adset_id, dateRange.start, dateRange.end, platform, selectedCampaign?.campaign_id)
          setAdData(data)
        }
        setSyncInfo(await getAdsSyncInfo())
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
        results: acc.results + (item.total_results || 0),
      }),
      { spend: 0, impressions: 0, clicks: 0, reach: 0, results: 0 }
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

  // Custo por resultado médio da lista (referência para as cores)
  const avgCpr = totals.results > 0 ? totals.spend / totals.results : 0
  const cprColor = (cpr: number) => {
    // No nível de clientes os tipos de resultado se misturam: não compara
    if (level === 'client' || avgCpr <= 0 || cpr <= 0) return ''
    if (cpr <= avgCpr * 0.85) return 'text-success'
    if (cpr >= avgCpr * 1.15) return 'text-destructive'
    return ''
  }

  const sortedData = [...currentData].sort((a: any, b: any) => {
    if (sortKey === 'results') return (b.total_results || 0) - (a.total_results || 0)
    if (sortKey === 'cpr') {
      // Menor custo primeiro; sem resultado vai para o fim
      const ca = a.cost_per_result > 0 ? a.cost_per_result : Infinity
      const cb = b.cost_per_result > 0 ? b.cost_per_result : Infinity
      return ca - cb
    }
    return (b.total_spend || 0) - (a.total_spend || 0)
  })

  const rowName = (row: any) =>
    level === 'client' ? row.client_name
      : level === 'campaign' ? row.campaign_name
      : level === 'adset' ? row.adset_name
      : row.ad_name

  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="campanhas" moduleDisplayName="Campanhas">
        <AppShell>
          <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold">Tráfego Pago</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Meta Ads e Google Ads dos clientes ativos
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {syncInfo.lastOkAt
                      ? `Atualizado em ${new Date(syncInfo.lastOkAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                      : 'Ainda sem atualização registrada'}
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

              {syncInfo.errors.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <p>
                    A última atualização teve erro em:{' '}
                    {Array.from(new Set(syncInfo.errors.map((e) => `${e.client_name || 'cliente'} (${e.platform === 'google' ? 'Google' : 'Meta'})`))).join(', ')}.
                  </p>
                </div>
              )}

              {/* Plataforma */}
              <div className="inline-flex items-center gap-1 self-start rounded-md border border-border bg-secondary p-1">
                {([
                  { value: 'all', label: 'Todas' },
                  { value: 'meta', label: 'Meta' },
                  { value: 'google', label: 'Google' },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPlatform(option.value)}
                    className={cn(
                      'px-4 h-8 text-sm rounded transition-colors',
                      platform === option.value
                        ? 'bg-card text-foreground font-medium shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Período */}
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {([
                  { value: 'hoje', label: 'Hoje' },
                  { value: '7d', label: '7 dias' },
                  { value: '30d', label: '30 dias' },
                  { value: 'mes', label: 'Este mês' },
                  { value: 'custom', label: 'Personalizado' },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => applyPreset(option.value)}
                    className={cn(
                      'shrink-0 rounded-full border px-4 h-9 text-sm whitespace-nowrap transition-colors',
                      preset === option.value
                        ? 'border-primary bg-primary/10 font-medium text-foreground'
                        : 'border-border bg-secondary text-muted-foreground'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {preset === 'custom' && (
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
                        {startDate ? format(startDate, "dd/MM/yyyy") : <span>Selecione a data</span>}
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
                        {endDate ? format(endDate, "dd/MM/yyyy") : <span>Selecione a data</span>}
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
              )}
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              <Card className="gap-1 py-3 bg-card border-border sm:gap-6 sm:py-6 [&:last-child:nth-child(odd)]:col-span-2 sm:[&:last-child:nth-child(odd)]:col-span-1">
                <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Investimento Total</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-bold sm:text-2xl">{formatCurrency(totals.spend)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-1 py-3 bg-card border-border sm:gap-6 sm:py-6 [&:last-child:nth-child(odd)]:col-span-2 sm:[&:last-child:nth-child(odd)]:col-span-1">
                <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Resultados</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-bold sm:text-2xl">{formatNumber(totals.results)}</span>
                  </div>
                  {totals.results > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatCurrency(totals.spend / totals.results)} por resultado
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="gap-1 py-3 bg-card border-border sm:gap-6 sm:py-6 [&:last-child:nth-child(odd)]:col-span-2 sm:[&:last-child:nth-child(odd)]:col-span-1">
                <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Alcance Total</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-bold sm:text-2xl">{formatNumber(totals.reach)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-1 py-3 bg-card border-border sm:gap-6 sm:py-6 [&:last-child:nth-child(odd)]:col-span-2 sm:[&:last-child:nth-child(odd)]:col-span-1">
                <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Impressões Totais</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-bold sm:text-2xl">{formatNumber(totals.impressions)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-1 py-3 bg-card border-border sm:gap-6 sm:py-6 [&:last-child:nth-child(odd)]:col-span-2 sm:[&:last-child:nth-child(odd)]:col-span-1">
                <CardHeader className="p-3 pb-1 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Cliques Totais</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-bold sm:text-2xl">{formatNumber(totals.clicks)}</span>
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
                  <>
                  {/* Ordenar */}
                  <div className="mb-3 flex items-center gap-2 overflow-x-auto">
                    <span className="shrink-0 text-xs text-muted-foreground">Ordenar por</span>
                    {([
                      { value: 'spend', label: 'Investimento' },
                      { value: 'results', label: 'Resultados' },
                      { value: 'cpr', label: 'Custo/resultado' },
                    ] as const).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSortKey(option.value)}
                        className={cn(
                          'shrink-0 rounded-full border px-3 h-8 text-xs whitespace-nowrap transition-colors',
                          sortKey === option.value
                            ? 'border-primary bg-primary/10 font-medium text-foreground'
                            : 'border-border bg-secondary text-muted-foreground'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Celular: um card por linha */}
                  <div className="space-y-2 sm:hidden">
                    {sortedData.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum dado disponível para o período selecionado
                      </p>
                    ) : (
                      sortedData.map((row: any, index: number) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => level !== 'ad' && handleRowClick(row)}
                          className="w-full rounded-lg border border-border bg-muted/20 p-3 text-left transition-colors active:bg-muted/50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 min-w-0 text-sm font-medium leading-snug">{rowName(row)}</p>
                            <div className="flex shrink-0 items-center gap-1">
                              {level === 'campaign' && (
                                <Badge variant="outline" className="text-[10px]">
                                  {row.platform === 'google' ? 'Google' : 'Meta'}
                                </Badge>
                              )}
                              {level !== 'ad' && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[11px] text-muted-foreground">Investimento</p>
                              <p className="text-base font-semibold">{formatCurrency(row.total_spend)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] text-muted-foreground">
                                Resultados{row.result_type ? ` · ${row.result_type}` : ''}
                              </p>
                              <p className="text-base font-semibold">
                                {row.total_results > 0 ? formatNumber(row.total_results) : '-'}
                                {row.cost_per_result > 0 && (
                                  <span className={cn('ml-2 text-xs font-medium', cprColor(row.cost_per_result))}>
                                    {formatCurrency(row.cost_per_result)}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatNumber(row.total_clicks)} cliques · {formatNumber(row.total_impressions)} impr. · CTR{' '}
                            {formatPercentage(row.ctr)} · CPM {formatCurrency(row.cpm)}
                          </p>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="hidden rounded-lg border border-border overflow-x-auto sm:block">
                    <Table className="min-w-[800px]">
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nome</TableHead>
                          {level === 'campaign' && (
                            <>
                              <TableHead>Plataforma</TableHead>
                              <TableHead>Objetivo</TableHead>
                              <TableHead>Status</TableHead>
                            </>
                          )}
                          <TableHead className="text-right">Resultados</TableHead>
                          <TableHead className="text-right">Custo/result.</TableHead>
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
                              colSpan={level === 'campaign' ? 13 : 10}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Nenhum dado disponível para o período selecionado
                            </TableCell>
                          </TableRow>
                        ) : (
                          sortedData.map((row: any, index) => (
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
                                    <Badge variant="outline" className="text-xs">
                                      {row.platform === 'google' ? 'Google' : 'Meta'}
                                    </Badge>
                                  </TableCell>
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
                                        ['ACTIVE', 'ENABLED'].includes(row.campaign_status) && 'bg-success/10 text-success border-success/20',
                                        row.campaign_status === 'PAUSED' && 'bg-warning/10 text-warning border-warning/20',
                                        ['ARCHIVED', 'REMOVED'].includes(row.campaign_status) && 'bg-muted text-muted-foreground border-muted'
                                      )}
                                    >
                                      {row.campaign_status}
                                    </Badge>
                                  </TableCell>
                                </>
                              )}
                              <TableCell className="text-right">
                                {row.total_results > 0 ? (
                                  <>
                                    {formatNumber(row.total_results)}
                                    {row.result_type && (
                                      <span className="ml-1 text-xs text-muted-foreground">{row.result_type}</span>
                                    )}
                                  </>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell className={cn('text-right font-medium', cprColor(row.cost_per_result))}>
                                {row.cost_per_result > 0 ? formatCurrency(row.cost_per_result) : '-'}
                              </TableCell>
                              <TableCell className="text-right">{row.total_reach > 0 ? formatNumber(row.total_reach) : '-'}</TableCell>
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
