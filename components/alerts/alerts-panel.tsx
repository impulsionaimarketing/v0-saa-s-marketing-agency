'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  AlertCircle, 
  CreditCard, 
  Ban, 
  TrendingDown, 
  FileX, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2
} from 'lucide-react'
import { getAlerts, resolveAlert, type Alert } from '@/lib/data/alerts'
import { cn } from '@/lib/utils'

const alertIcons = {
  late_task: AlertCircle,
  no_balance: CreditCard,
  blocked_account: Ban,
  kpi_issue: TrendingDown,
  pending_report: FileX,
}

const alertTypeLabels = {
  late_task: 'Tarefa Atrasada',
  no_balance: 'Sem Saldo',
  blocked_account: 'Conta Bloqueada',
  kpi_issue: 'KPI Fora da Meta',
  pending_report: 'Relatório Pendente',
}

const severityColors = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-muted text-muted-foreground border-muted',
}

const severityLabels = {
  high: 'Crítico',
  medium: 'Médio',
  low: 'Baixo',
}

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [])

  useEffect(() => {
    loadAlerts()
  }, [typeFilter, severityFilter])

  async function loadAlerts() {
    setIsLoading(true)
    try {
      const data = await getAlerts({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        is_resolved: false,
      })
      setAlerts(data)
    } catch (error) {
      console.error('[v0] Error loading alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResolve(id: string) {
    try {
      await resolveAlert(id)
      setAlerts(prev => prev.filter(a => a.id !== id))
    } catch (error) {
      console.error('[v0] Error resolving alert:', error)
    }
  }

  const highCount = alerts.filter(a => a.severity === 'high').length
  const mediumCount = alerts.filter(a => a.severity === 'medium').length
  const lowCount = alerts.filter(a => a.severity === 'low').length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
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
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total de Alertas</p>
                <p className="text-xl font-bold">{alerts.length}</p>
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
                <p className="text-xs text-muted-foreground">Críticos</p>
                <p className="text-xl font-bold">{highCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Médios</p>
                <p className="text-xl font-bold">{mediumCount}</p>
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
                <p className="text-xs text-muted-foreground">Baixos</p>
                <p className="text-xl font-bold">{lowCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex gap-2 flex-1">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48 bg-secondary border-border">
                  <SelectValue placeholder="Tipo de alerta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="late_task">Tarefa Atrasada</SelectItem>
                  <SelectItem value="no_balance">Sem Saldo</SelectItem>
                  <SelectItem value="blocked_account">Conta Bloqueada</SelectItem>
                  <SelectItem value="kpi_issue">KPI Fora da Meta</SelectItem>
                  <SelectItem value="pending_report">Relatório Pendente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-36 bg-secondary border-border">
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="high">Crítico</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="low">Baixo</SelectItem>
                </SelectContent>
              </Select>
              {isPending && <Loader2 className="h-4 w-4 animate-spin self-center" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts list */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Alertas Ativos ({alerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => {
              const Icon = alertIcons[alert.type] || AlertCircle
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-start gap-4 rounded-lg border p-4 transition-colors',
                    alert.severity === 'high' ? 'border-destructive/30 bg-destructive/5' :
                    alert.severity === 'medium' ? 'border-warning/30 bg-warning/5' :
                    'border-border'
                  )}
                >
                  <div className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                    alert.severity === 'high' ? 'bg-destructive/10' : 
                    alert.severity === 'medium' ? 'bg-warning/10' : 'bg-muted'
                  )}>
                    <Icon className={cn(
                      'h-6 w-6',
                      alert.severity === 'high' ? 'text-destructive' : 
                      alert.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{alert.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge variant="outline" className={cn(severityColors[alert.severity])}>
                          {severityLabels[alert.severity]}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {alertTypeLabels[alert.type]}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {alert.client_name && (
                          <span>Cliente: <span className="text-foreground">{alert.client_name}</span></span>
                        )}
                        <span>{formatDate(alert.created_at)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => handleResolve(alert.id)}
                        >
                          Resolver
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {alerts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <CheckCircle className="h-12 w-12 text-success mb-4" />
                <p className="text-lg font-medium">Tudo em ordem!</p>
                <p className="text-muted-foreground">Não há alertas para os filtros selecionados</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
