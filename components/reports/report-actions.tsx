'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, FileDown, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markReportSent, deleteClientReport, type ClientReport } from '@/lib/data/client-reports'

const STATUS_LABEL = { rascunho: 'Rascunho', enviado: 'Enviado', visualizado: 'Visualizado pelo cliente' } as const

export function ReportActions({ report }: { report: ClientReport }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const link = () => `${window.location.origin}/relatorio/${report.token}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copie o link:', link())
    }
  }

  const exportPdf = () => window.open(`${link()}?print=1`, '_blank')

  const sent = () =>
    startTransition(async () => {
      await markReportSent(report.id)
      router.refresh()
    })

  const remove = () => {
    if (!confirm(`Excluir "${report.title}"? O link deixa de funcionar e a ação não pode ser desfeita.`)) return
    startTransition(async () => {
      await deleteClientReport(report.id)
      router.push('/relatorios')
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
        {STATUS_LABEL[report.status]}
      </span>
      <div className="ml-auto flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiado' : 'Copiar link'}
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={exportPdf}>
          <FileDown className="h-4 w-4" /> Exportar PDF
        </Button>
        {report.status === 'rascunho' && (
          <Button size="sm" className="gap-2" onClick={sent} disabled={isPending}>
            <Send className="h-4 w-4" /> Marcar como enviado
          </Button>
        )}
        <Button
          variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"
          aria-label="Excluir relatório" onClick={remove} disabled={isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
