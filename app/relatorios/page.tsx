'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Loader2, ChevronRight } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getClients, type Client } from '@/lib/data/clients'
import { getClientReports, createClientReport, type ClientReport } from '@/lib/data/client-reports'
import { cn } from '@/lib/utils'

const STATUS_LABEL = { rascunho: 'Rascunho', enviado: 'Enviado', visualizado: 'Visualizado' } as const
const STATUS_STYLE = {
  rascunho: 'bg-muted text-muted-foreground border-muted',
  enviado: 'bg-warning/10 text-warning border-warning/20',
  visualizado: 'bg-success/10 text-success border-success/20',
} as const

const iso = (d: Date) => d.toISOString().slice(0, 10)
const fmtBR = (v: string) => v.split('-').reverse().join('/')

type Preset = 'anterior' | 'este' | 'custom'

function presetRange(preset: Preset): { start: string; end: string } {
  const now = new Date()
  if (preset === 'anterior') {
    return { start: iso(new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1))), end: iso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 0))) }
  }
  // Este mês: do dia 1 até ontem (hoje ainda não fechou)
  const yesterday = new Date(now.getTime() - 86400000)
  const first = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
  return { start: iso(first), end: iso(yesterday < first ? now : yesterday) }
}

export default function RelatoriosPage() {
  const router = useRouter()
  const [reports, setReports] = useState<ClientReport[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [clientFilter, setClientFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [preset, setPreset] = useState<Preset>('anterior')
  const [range, setRange] = useState(() => presetRange('anterior'))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function load() {
      const [r, c] = await Promise.all([getClientReports(), getClients({ status: 'Ativo' })])
      setReports(r)
      setClients(c)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(
    () =>
      reports.filter(
        (r) => (clientFilter === 'all' || r.client_id === clientFilter) && (statusFilter === 'all' || r.status === statusFilter),
      ),
    [reports, clientFilter, statusFilter],
  )

  const choosePreset = (p: Preset) => {
    setPreset(p)
    if (p !== 'custom') setRange(presetRange(p))
  }

  const handleCreate = () => {
    setError(null)
    if (!clientId) return setError('Escolha o cliente.')
    if (range.end < range.start) return setError('A data final não pode ser antes da inicial.')
    startTransition(async () => {
      try {
        const created = await createClientReport({ clientId, start: range.start, end: range.end })
        setOpen(false)
        router.push(`/relatorios/${created.id}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao gerar o relatório')
      }
    })
  }

  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="relatorios" moduleDisplayName="Relatórios">
        <AppShell>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">Relatórios</h1>
                <p className="text-sm text-muted-foreground sm:text-base">Resumo de tráfego pago por cliente, em PDF e link</p>
              </div>
              <Button className="shrink-0 gap-2" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo relatório</span>
              </Button>
            </div>

            <div className="flex gap-2">
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="flex-1 bg-secondary border-border"><SelectValue placeholder="Cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 bg-secondary border-border"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="visualizado">Visualizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                {reports.length === 0 ? 'Nenhum relatório ainda.' : 'Nenhum relatório com esses filtros.'}
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Criar o primeiro relatório</Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {filtered.map((r) => (
                  <Link
                    key={r.id}
                    href={`/relatorios/${r.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors active:bg-muted/50 sm:hover:bg-muted/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.client_name || 'Cliente'}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {fmtBR(r.period_start)} a {fmtBR(r.period_end)}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn('shrink-0 text-xs', STATUS_STYLE[r.status])}>
                      {STATUS_LABEL[r.status]}
                    </Badge>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[95vw] sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle>Novo relatório</DialogTitle>
                <DialogDescription>Os números são congelados na hora de gerar.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-2">
                <Label>Cliente</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Escolha o cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Período</Label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'anterior', label: 'Mês anterior' },
                    { value: 'este', label: 'Este mês' },
                    { value: 'custom', label: 'Personalizado' },
                  ] as const).map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => choosePreset(o.value)}
                      className={cn(
                        'rounded-full border px-4 h-9 text-sm transition-colors',
                        preset === o.value ? 'border-primary bg-primary/10 font-medium' : 'border-border bg-secondary text-muted-foreground',
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={range.start} disabled={preset !== 'custom'}
                    onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} className="bg-secondary border-border" />
                  <Input type="date" value={range.end} disabled={preset !== 'custom'}
                    onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} className="bg-secondary border-border" />
                </div>
                <p className="text-xs text-muted-foreground">Compara com o período de mesma duração logo antes.</p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button onClick={handleCreate} disabled={isPending} className="w-full">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gerar relatório'}
              </Button>
            </DialogContent>
          </Dialog>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
