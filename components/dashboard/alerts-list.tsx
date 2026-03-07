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
          <div className="space-y-4">
            {alerts.map((alert) => {
              const Icon = alertIcons[alert.type] || AlertCircle
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
                >
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <Badge variant="outline" className={cn('shrink-0', severityColors[alert.severity])}>
                        {severityLabels[alert.severity]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                    {alert.client_name && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Cliente: <span className="text-foreground">{alert.client_name}</span>
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
