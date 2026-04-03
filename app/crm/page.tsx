'use client'

import { CRMKanban } from '@/components/crm/crm-kanban'

export default function CRMPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
        <p className="text-muted-foreground">
          Gerencie seus leads e acompanhe o funil de vendas
        </p>
      </div>

      <CRMKanban />
    </div>
  )
}
