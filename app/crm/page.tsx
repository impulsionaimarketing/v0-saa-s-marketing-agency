import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { CRMKanban } from '@/components/crm/crm-kanban'
import { getCRMCards } from '@/lib/data/crm-leads'
import type { CRMCard } from '@/lib/data/crm-config'

export default async function CRMPage() {
  let initialCards: CRMCard[] = []

  try {
    const data = await getCRMCards()
    initialCards = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('[v0] Error fetching initial CRM cards:', error)
    initialCards = []
  }

  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="crm" moduleDisplayName="CRM">
        <AppShell>
          <div className="space-y-6">
            {/* Page header */}
            <div>
              <h1 className="text-2xl font-bold">CRM</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Gerencie seus leads e acompanhe o funil de vendas
              </p>
            </div>

            <CRMKanban initialCards={initialCards} />
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
