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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => (
        <Card key={stat.name} className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
