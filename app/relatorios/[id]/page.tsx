import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { ReportView } from '@/components/reports/report-view'
import { ReportActions } from '@/components/reports/report-actions'
import { getClientReportById } from '@/lib/data/client-reports'

export const dynamic = 'force-dynamic'

export default async function RelatorioDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const report = await getClientReportById(id)
  if (!report) notFound()

  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="relatorios" moduleDisplayName="Relatórios">
        <AppShell>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Link href="/relatorios" className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-secondary" aria-label="Voltar">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="min-w-0 truncate text-lg font-bold sm:text-2xl">{report.title}</h1>
            </div>
            <ReportActions report={report} />
            <div className="-mx-3 sm:mx-0">
              <ReportView title={report.title} snapshot={report.snapshot} />
            </div>
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
