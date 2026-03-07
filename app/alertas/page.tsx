import { Suspense } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { AlertsPanel } from '@/components/alerts/alerts-panel'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function AlertsSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default function AlertasPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold">Alertas</h1>
          <p className="text-muted-foreground">Monitore problemas que requerem atenção</p>
        </div>

        {/* Content */}
        <Suspense fallback={<AlertsSkeleton />}>
          <AlertsPanel />
        </Suspense>
      </div>
    </AppShell>
  )
}
