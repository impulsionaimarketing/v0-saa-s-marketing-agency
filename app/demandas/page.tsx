import { Suspense } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { DemandsChecklist } from '@/components/demands/demands-checklist'
import { Skeleton } from '@/components/ui/skeleton'

function ChecklistSkeleton() {
  return (
    <div className="space-y-4">
      {/* Summary skeleton */}
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-24" />
      </div>
      {/* Filters skeleton */}
      <Skeleton className="h-14 w-full rounded-lg" />
      {/* Client groups skeleton */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
          <div className="border-t border-border">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center gap-3 p-4 border-b border-border/50 last:border-b-0">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
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

            {/* Checklist view */}
            <Suspense fallback={<ChecklistSkeleton />}>
              <DemandsChecklist />
            </Suspense>
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
