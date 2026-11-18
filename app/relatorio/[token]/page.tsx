import { notFound } from 'next/navigation'
import { getClientReportByToken } from '@/lib/data/client-reports'
import { ReportView } from '@/components/reports/report-view'
import { AutoPrint } from '@/components/reports/auto-print'

export const dynamic = 'force-dynamic'

// Página pública do relatório (link enviado ao cliente), sem menu do sistema
export default async function PublicReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const report = await getClientReportByToken(token)
  if (!report) notFound()

  return (
    <main className="min-h-screen bg-neutral-100 sm:p-8 print:bg-white print:p-0">
      <AutoPrint />
      <ReportView title={report.title} snapshot={report.snapshot} />
    </main>
  )
}
