import { CRMKanban } from '@/components/crm/crm-kanban'
import { getCRMLeads, type CRMLead } from '@/lib/data/crm-leads'

export default async function CRMPage() {
  let initialLeads: CRMLead[] = []
  
  try {
    const data = await getCRMLeads()
    initialLeads = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('[v0] Error fetching initial CRM leads:', error)
    initialLeads = []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
        <p className="text-muted-foreground">
          Gerencie seus leads e acompanhe o funil de vendas
        </p>
      </div>

      <CRMKanban initialLeads={initialLeads} />
    </div>
  )
}
