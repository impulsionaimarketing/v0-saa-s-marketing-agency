import { Suspense } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { CRMKanban } from '@/components/crm/crm-kanban'
import { Skeleton } from '@/components/ui/skeleton'

function CRMKanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[...Array(5)].map((_, i) => (
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

export default function CRMPage() {
  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="crm" moduleDisplayName="CRM">
        <AppShell>
          <div className="space-y-6">
            {/* Page header */}
            <div>
              <h1 className="text-2xl font-bold">CRM</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Gerencie seus leads e acompanhe o funil de vendas</p>
            </div>

            {/* CRM Kanban board */}
            <Suspense fallback={<CRMKanbanSkeleton />}>
              <CRMKanban />
            </Suspense>
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
