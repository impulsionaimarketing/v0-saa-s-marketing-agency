'use client'

import { CRMVisual } from '@/components/crm/crm-visual'

export default function CRMPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
        <p className="text-muted-foreground">
          Gerencie seus leads e acompanhe o funil de vendas
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <CRMVisual />
      </div>
    </div>
  )
}
