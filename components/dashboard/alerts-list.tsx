import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, CreditCard, Ban, TrendingDown, FileX, ChevronRight, CheckCircle2 } from 'lucide-react'
import { getAlerts } from '@/lib/data/alerts'
import { cn } from '@/lib/utils'

const alertIcons = {
  late_task: AlertCircle,
  no_balance: CreditCard,
  blocked_account: Ban,
  kpi_issue: TrendingDown,
  pending_report: FileX,
}

const severityLabels = { high: 'Crítico', medium: 'Médio', low: 'Baixo' } as const
const severityOrder = { high: 0, medium: 1, low: 2 } as const

const styles = {
  high: { bar: 'bg-destructive', icon: 'bg-destructive/10 text-destructive', chip: 'bg-destructive/10 text-destructive' },
  medium: { bar: 'bg-warning', icon: 'bg-warning/10 text-warning', chip: 'bg-warning/10 text-warning' },
  low: { bar: 'bg-muted-foreground/40', icon: 'bg-muted text-muted-foreground', chip: 'bg-muted text-muted-foreground' },
} as const

export async function AlertsList() {
  const all = await getAlerts({ is_resolved: false, limit: 50 })
  const sorted = [...all].sort(
    (a, b) =>
      severityOrder[a.severity] - severityOrder[b.severity] ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  const shown = sorted.slice(0, 5)
  const counts = { high: 0, medium: 0, low: 0 }
  all.forEach((a) => counts[a.severity]++)

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Alertas</h2>
            <p className="text-sm text-muted-foreground">
              {all.length === 0 ? 'Tudo em dia' : `${all.length} ${all.length === 1 ? 'pendente' : 'pendentes'}`}
            </p>
          </div>
          <Link href="/alertas" className="text-sm font-medium text-primary flex items-center shrink-0">
            Ver todos <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {all.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            Nenhum alerta pendente
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {(['high', 'medium', 'low'] as const).map((s) => (
                <div key={s} className={cn('rounded-lg px-2 py-2 text-center', styles[s].chip)}>
                  <p className="text-xl font-bold leading-none">{counts[s]}</p>
                  <p className="text-xs mt-1">{severityLabels[s]}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {shown.map((alert) => {
                const Icon = alertIcons[alert.type] || AlertCircle
                const st = styles[alert.severity]
                return (
                  <Link
                    key={alert.id}
                    href="/alertas"
                    className="relative flex items-start gap-3 overflow-hidden rounded-lg border border-border bg-muted/20 p-3 pl-4 active:bg-muted/50 sm:hover:bg-muted/40"
                  >
                    <span className={cn('absolute left-0 inset-y-0 w-1', st.bar)} />
                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', st.icon)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug line-clamp-2">{alert.title}</p>
                      {alert.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={cn('rounded px-1.5 py-0.5 font-medium', st.chip)}>
                          {severityLabels[alert.severity]}
                        </span>
                        {alert.client_name && <span className="truncate">{alert.client_name}</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {all.length > shown.length && (
              <Link
                href="/alertas"
                className="mt-3 block rounded-lg border border-border py-2 text-center text-sm font-medium text-primary"
              >
                Ver mais {all.length - shown.length} alertas
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
