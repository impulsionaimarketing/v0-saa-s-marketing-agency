import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CreditCard, Ban, TrendingDown, FileX } from 'lucide-react'
import { getAlerts } from '@/lib/data/alerts'
import { cn } from '@/lib/utils'

const alertIcons = {
  late_task: AlertCircle,
  no_balance: CreditCard,
  blocked_account: Ban,
  kpi_issue: TrendingDown,
  pending_report: FileX,
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

export async function AlertsList() {
  const alerts = await getAlerts({ is_resolved: false, limit: 5 })

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Alertas Recentes</CardTitle>
        <CardDescription>Problemas que requerem atenção</CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum alerta pendente
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert) => {
              const Icon = alertIcons[alert.type] || AlertCircle
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'rounded-lg border p-4 transition-all hover:shadow-md hover:scale-105',
                    alert.severity === 'high' ? 'border-destructive/30 bg-destructive/5' : 
                    alert.severity === 'medium' ? 'border-warning/30 bg-warning/5' : 'border-border bg-muted/30'
                  )}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      alert.severity === 'high' ? 'bg-destructive/10' : 
                      alert.severity === 'medium' ? 'bg-warning/10' : 'bg-muted'
                    )}>
                      <Icon className={cn(
                        'h-5 w-5',
                        alert.severity === 'high' ? 'text-destructive' : 
                        alert.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'
                      )} />
                    </div>
                    <Badge variant="outline" className={cn('shrink-0', severityColors[alert.severity])}>
                      {severityLabels[alert.severity]}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium text-sm line-clamp-2">{alert.title}</p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{alert.description}</p>
                    {alert.client_name && (
                      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                        <span className="font-medium">Cliente:</span> {alert.client_name}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
