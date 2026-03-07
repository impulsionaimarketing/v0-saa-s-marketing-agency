import { Suspense } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { ClientsTable } from '@/components/clients/clients-table'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function ClientsTableSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ClientesPage() {
  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="clientes" moduleDisplayName="Clientes">
        <AppShell>
          <div className="space-y-6">
            {/* Page header */}
            <div>
              <h1 className="text-2xl font-bold">Clientes</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Gerencie os clientes da agência</p>
            </div>

            {/* Clients table */}
            <Suspense fallback={<ClientsTableSkeleton />}>
              <ClientsTable />
            </Suspense>
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
