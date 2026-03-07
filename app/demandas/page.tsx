import { Suspense } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { DemandsKanban } from '@/components/demands/demands-kanban'
import { Skeleton } from '@/components/ui/skeleton'

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-72">
          <Skeleton className="h-6 w-24 mb-3" />
          <div className="space-y-3 min-h-[400px] rounded-lg bg-secondary/30 p-2">
            {[...Array(3)].map((_, j) => (
              <Skeleton key={j} className="h-32 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DemandasPage() {
  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="demandas" moduleDisplayName="Demandas">
        <AppShell>
          <div className="space-y-6">
            {/* Page header */}
            <div>
              <h1 className="text-2xl font-bold">Demandas</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Gerencie as demandas da agência</p>
            </div>

            {/* Kanban board */}
            <Suspense fallback={<KanbanSkeleton />}>
              <DemandsKanban />
            </Suspense>
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
