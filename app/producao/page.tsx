import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { ProductionPipeline } from '@/components/productions/production-pipeline'

export default function ProducaoPage() {
  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="producoes" moduleDisplayName="Produções">
        <AppShell>
          <div className="space-y-6">
            {/* Page header */}
            <div>
              <h1 className="text-2xl font-bold">Produção de Conteúdo</h1>
              <p className="text-muted-foreground">Pipeline visual de criativos</p>
            </div>

            {/* Production Pipeline */}
            <ProductionPipeline />
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
