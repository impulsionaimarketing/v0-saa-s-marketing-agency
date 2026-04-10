import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { DemandsViewToggle } from '@/components/demands/demands-view-toggle'

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

            {/* View with toggle */}
            <DemandsViewToggle />
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
