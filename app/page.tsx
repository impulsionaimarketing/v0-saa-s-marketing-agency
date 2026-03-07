import { Suspense } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppShell } from '@/components/layout/app-shell'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { AlertsList } from '@/components/dashboard/alerts-list'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AlertsListSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-56 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral da agência</p>
          </div>

          {/* Stats cards */}
          <Suspense fallback={<StatsCardsSkeleton />}>
            <StatsCards />
          </Suspense>

          {/* Alerts */}
        <Suspense fallback={<AlertsListSkeleton />}>
          <AlertsList />
        </Suspense>
      </div>
      </AppShell>
    </ProtectedRoute>
  )
}
