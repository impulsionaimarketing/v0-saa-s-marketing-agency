import { CrmKanban } from '@/components/crm/crm-kanban'

export const metadata = {
  title: 'CRM | Impulsionaí',
  description: 'Gerencie seus leads e clientes com nosso CRM visual em estilo Kanban',
}

export default function CrmPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">CRM de Vendas</h1>
        <p className="text-muted-foreground">
          Gerencie seus leads e acompanhe o progresso de cada negociação
        </p>
      </div>

      <CrmKanban />
    </div>
  )
}
