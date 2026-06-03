'use client'

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
              <h1 className="text-2xl font-bold text-foreground">Produção de Conteúdo</h1>
              <p className="text-muted-foreground">Gerencie e acompanhe seus conteúdos</p>
            </div>

            {/* Production Pipeline Component */}
            <ProductionPipeline />
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
