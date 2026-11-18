import { Users, ClipboardList, AlertCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getDashboardStats } from '@/lib/data/dashboard'

export async function StatsCards() {
  const stats = await getDashboardStats()

  const cards = [
    {
      name: 'Clientes Ativos',
      value: stats.activeClients,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      name: 'Demandas em Aberto',
      value: stats.pendingDemands,
      icon: ClipboardList,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      name: 'Demandas Atrasadas',
      value: stats.lateDemands,
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      name: 'Alertas Pendentes',
      value: stats.unreadAlerts,
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((stat) => (
        <Card key={stat.name} className="bg-card border-border">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">{stat.name}</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stat.value}</p>
              </div>
              <div className={`flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
