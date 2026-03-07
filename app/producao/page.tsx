import { AppShell } from '@/components/layout/app-shell'
import { ProductionPipeline } from '@/components/productions/production-pipeline'

export default function ProducaoPage() {
  return (
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
  )
}
