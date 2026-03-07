import { Suspense } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { CollaboratorsTable } from '@/components/collaborators/collaborators-table'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function CollaboratorsSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default function ColaboradoresPage() {
  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="usuarios" moduleDisplayName="Usuários">
        <AppShell>
          <div className="space-y-6">
            {/* Page header */}
            <div>
              <h1 className="text-2xl font-bold">Colaboradores</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Gerencie a equipe da agência</p>
            </div>

            {/* Content */}
            <Suspense fallback={<CollaboratorsSkeleton />}>
              <CollaboratorsTable />
            </Suspense>
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
