'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Calendar, X } from 'lucide-react'
import { getMetaAdsInsights, getUniqueClients, getCampaignsByClient, type MetaAdsInsight } from '@/lib/data/meta-ads'
import { cn } from '@/lib/utils'

export function MetaAdsInsightsTable() {
  const [data, setData] = useState<MetaAdsInsight[]>([])
  const [filteredData, setFilteredData] = useState<MetaAdsInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all')
  const [campaignStatus, setCampaignStatus] = useState<string>('all')
  const [campaignObjective, setCampaignObjective] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [clients, setClients] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [campaignStatuses, setCampaignStatuses] = useState<string[]>([])
  const [campaignObjectives, setCampaignObjectives] = useState<string[]>([])

  // Load initial data
  useEffect(() => {
    loadData()
    loadClients()
  }, [])

  // Load campaigns when client changes
  useEffect(() => {
    if (selectedClient !== 'all') {
      loadCampaigns()
    } else {
      setCampaigns([])
      setSelectedCampaign('all')
    }
  }, [selectedClient])

  // Apply filters
  useEffect(() => {
    let filtered = data

    if (selectedClient !== 'all') {
      filtered = filtered.filter((item) => item.client_id === selectedClient)
    }

    if (selectedCampaign !== 'all') {
      filtered = filtered.filter((item) => item.campaign_id === selectedCampaign)
    }

    if (campaignStatus !== 'all') {
      filtered = filtered.filter((item) => item.campaign_status === campaignStatus)
    }

    if (campaignObjective !== 'all') {
      filtered = filtered.filter((item) => item.campaign_objective === campaignObjective)
    }

    if (startDate) {
      filtered = filtered.filter((item) => item.report_date >= startDate)
    }

    if (endDate) {
      filtered = filtered.filter((item) => item.report_date <= endDate)
    }

    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.ad_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.adset_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredData(filtered)
  }, [data, selectedClient, selectedCampaign, campaignStatus, campaignObjective, startDate, endDate, searchQuery])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const insights = await getMetaAdsInsights()
      setData(insights)

      // Extract unique statuses and objectives
      const statuses = [...new Set(insights.map((item) => item.campaign_status).filter(Boolean))]
      const objectives = [...new Set(insights.map((item) => item.campaign_objective).filter(Boolean))]
      setCampaignStatuses(statuses.sort())
      setCampaignObjectives(objectives.sort())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados'
      setError(message)
      console.error('[v0] Error loading meta ads data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const clientList = await getUniqueClients()
      setClients(clientList)
    } catch (err) {
      console.error('[v0] Error loading clients:', err)
    }
  }

  const loadCampaigns = async () => {
    try {
      const campaignList = await getCampaignsByClient(selectedClient)
      setCampaigns(campaignList)
    } catch (err) {
      console.error('[v0] Error loading campaigns:', err)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const getCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return '0%'
    return ((clicks / impressions) * 100).toFixed(2) + '%'
  }

  const getCPC = (spend: number, clicks: number) => {
    if (clicks === 0) return 'N/A'
    return formatCurrency(spend / clicks)
  }

  const getCPM = (spend: number, impressions: number) => {
    if (impressions === 0) return 'N/A'
    return formatCurrency((spend / impressions) * 1000)
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedClient('all')
    setSelectedCampaign('all')
    setCampaignStatus('all')
    setCampaignObjective('all')
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = selectedClient !== 'all' || selectedCampaign !== 'all' || campaignStatus !== 'all' || campaignObjective !== 'all' || startDate || endDate || searchQuery

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filtros</CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 gap-2"
              >
                <X className="h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por anúncio, campanha ou cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {/* Client */}
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.client_id} value={client.client_id}>
                    {client.client_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Campaign */}
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign} disabled={selectedClient === 'all'}>
              <SelectTrigger>
                <SelectValue placeholder="Campanha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as campanhas</SelectItem>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                    {campaign.campaign_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Campaign Status */}
            <Select value={campaignStatus} onValueChange={setCampaignStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status da Campanha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {campaignStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Campaign Objective */}
            <Select value={campaignObjective} onValueChange={setCampaignObjective}>
              <SelectTrigger>
                <SelectValue placeholder="Objetivo da Campanha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os objetivos</SelectItem>
                {campaignObjectives.map((objective) => (
                  <SelectItem key={objective} value={objective}>
                    {objective}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10"
                placeholder="Data de início"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10"
                placeholder="Data de fim"
              />
            </div>
          </div>

          {/* Results count */}
          <div className="text-xs text-muted-foreground pt-2">
            {filteredData.length} resultado{filteredData.length !== 1 ? 's' : ''} encontrado{filteredData.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data table */}
      {!isLoading && (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Cliente</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Alcance</TableHead>
                <TableHead className="text-right">Impressões</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Investimento</TableHead>
                <TableHead className="text-right">CPM</TableHead>
                <TableHead className="text-right">CPC</TableHead>
                <TableHead className="text-right">Freq.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    Nenhum resultado encontrado com os filtros selecionados
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={`${item.report_date}-${item.ad_id}-${index}`} className="border-border">
                    <TableCell className="font-medium text-sm">{item.client_name || 'N/A'}</TableCell>
                    <TableCell className="text-sm">{item.campaign_name || 'N/A'}</TableCell>
                    <TableCell className="text-sm">
                      <Badge variant="secondary" className="text-xs">
                        {item.campaign_objective || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          item.campaign_status === 'ACTIVE' && 'bg-success/10 text-success border-success/20',
                          item.campaign_status === 'PAUSED' && 'bg-warning/10 text-warning border-warning/20',
                          item.campaign_status === 'ARCHIVED' && 'bg-muted text-muted-foreground border-muted'
                        )}
                      >
                        {item.campaign_status || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{formatNumber(item.reach || 0)}</TableCell>
                    <TableCell className="text-right text-sm">{formatNumber(item.impressions || 0)}</TableCell>
                    <TableCell className="text-right text-sm">{formatNumber(item.clicks || 0)}</TableCell>
                    <TableCell className="text-right text-sm text-blue-600 font-medium">
                      {getCTR(item.clicks || 0, item.impressions || 0)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatCurrency(item.spend || 0)}</TableCell>
                    <TableCell className="text-right text-sm">{getCPM(item.spend || 0, item.impressions || 0)}</TableCell>
                    <TableCell className="text-right text-sm">{getCPC(item.spend || 0, item.clicks || 0)}</TableCell>
                    <TableCell className="text-right text-sm">{(item.frequency || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
