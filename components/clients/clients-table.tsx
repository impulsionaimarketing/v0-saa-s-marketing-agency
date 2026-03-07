'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Search, Eye, Loader2, Pencil, Trash2, Columns3, Check, X } from 'lucide-react'
import { getClients, updateClient, deleteClient, type Client } from '@/lib/data/clients'
import { ClientFormDialog } from './client-form-dialog'
import { DeleteDialog } from '@/components/shared/delete-dialog'
import { cn } from '@/lib/utils'

// ─── Column definitions ───────────────────────────────────────────────────────
type ColKey = keyof Client

interface ColDef {
  key: ColKey
  label: string
  defaultVisible: boolean
  minWidth: string
  render: (client: Client) => React.ReactNode
  editType: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'none'
  editOptions?: string[]
}

const ALL_COLUMNS: ColDef[] = [
  {
    key: 'name',
    label: 'Empresa',
    defaultVisible: true,
    minWidth: 'min-w-36',
    editType: 'none', // editable via dialog
    render: (c) => (
      <Link href={`/clientes/${encodeURIComponent(c.name)}`}>
        <div>
          <p className="font-medium text-sm text-primary hover:text-primary/80 transition-colors">{c.name}</p>
          <p className="text-xs text-muted-foreground">{c.type}</p>
        </div>
      </Link>
    ),
  },
  {
    key: 'contract_status',
    label: 'Status',
    defaultVisible: true,
    minWidth: 'min-w-28',
    editType: 'select',
    editOptions: ['Ativo', 'Pausado', 'Perdido'],
    render: (c) => (
      <Badge
        variant="outline"
        className={cn(
          c.contract_status === 'Ativo' && 'bg-success/10 text-success border-success/20',
          c.contract_status === 'Pausado' && 'bg-warning/10 text-warning border-warning/20',
          c.contract_status === 'Perdido' && 'bg-destructive/10 text-destructive border-destructive/20',
        )}
        size="sm"
      >
        {c.contract_status}
      </Badge>
    ),
  },
  {
    key: 'plan',
    label: 'Plano',
    defaultVisible: true,
    minWidth: 'min-w-24',
    editType: 'text',
    render: (c) => <Badge variant="secondary" size="sm">{c.plan}</Badge>,
  },
  {
    key: 'monthly_value',
    label: 'Valor',
    defaultVisible: true,
    minWidth: 'min-w-28',
    editType: 'number',
    render: (c) => (
      <span className="font-medium text-sm">R$ {Number(c.monthly_value).toLocaleString('pt-BR')}</span>
    ),
  },
  {
    key: 'payment_frequency',
    label: 'Frequência',
    defaultVisible: true,
    minWidth: 'min-w-28',
    editType: 'select',
    editOptions: ['Semanal', 'Quinzenal', 'Mensal', 'Bimestral', 'Trimestral', 'Anual'],
    render: (c) => <Badge variant="outline" size="sm">{c.payment_frequency || 'Mensal'}</Badge>,
  },
  {
    key: 'payment_day',
    label: 'Dia Pgto',
    defaultVisible: false,
    minWidth: 'min-w-20',
    editType: 'number',
    render: (c) => <span className="text-sm">{c.payment_day || '-'}</span>,
  },
  {
    key: 'renewal_date',
    label: 'Vencimento',
    defaultVisible: true,
    minWidth: 'min-w-28',
    editType: 'date',
    render: (c) => (
      <span className="text-sm">
        {c.renewal_date ? new Date(c.renewal_date).toLocaleDateString('pt-BR') : '-'}
      </span>
    ),
  },
  {
    key: 'month_status',
    label: 'Mês',
    defaultVisible: true,
    minWidth: 'min-w-16',
    editType: 'select',
    editOptions: ['green', 'yellow', 'red'],
    render: (c) => (
      <div className="flex justify-center">
        <div
          className={cn(
            'h-3 w-3 rounded-full',
            c.month_status === 'green' && 'bg-success',
            c.month_status === 'yellow' && 'bg-warning',
            c.month_status === 'red' && 'bg-destructive',
          )}
        />
      </div>
    ),
  },
  {
    key: 'type',
    label: 'Tipo',
    defaultVisible: false,
    minWidth: 'min-w-24',
    editType: 'select',
    editOptions: ['Serviço', 'Infoproduto', 'Local'],
    render: (c) => <span className="text-sm">{c.type}</span>,
  },
  {
    key: 'campaign_type',
    label: 'Tipo Campanha',
    defaultVisible: false,
    minWidth: 'min-w-32',
    editType: 'select',
    editOptions: ['Mensagem', 'Venda', 'Alcance'],
    render: (c) => <span className="text-sm">{c.campaign_type || '-'}</span>,
  },
  {
    key: 'contract_start_date',
    label: 'Início Contrato',
    defaultVisible: false,
    minWidth: 'min-w-28',
    editType: 'date',
    render: (c) => (
      <span className="text-sm">
        {c.contract_start_date ? new Date(c.contract_start_date).toLocaleDateString('pt-BR') : '-'}
      </span>
    ),
  },
  {
    key: 'contract_end_date',
    label: 'Fim Contrato',
    defaultVisible: false,
    minWidth: 'min-w-28',
    editType: 'date',
    render: (c) => (
      <span className="text-sm">
        {c.contract_end_date ? new Date(c.contract_end_date).toLocaleDateString('pt-BR') : '-'}
      </span>
    ),
  },
  {
    key: 'whatsapp_group_name',
    label: 'Grupo WA',
    defaultVisible: false,
    minWidth: 'min-w-32',
    editType: 'text',
    render: (c) => <span className="text-sm">{c.whatsapp_group_name || '-'}</span>,
  },
  {
    key: 'whatsapp_group_id',
    label: 'ID Grupo WA',
    defaultVisible: false,
    minWidth: 'min-w-32',
    editType: 'text',
    render: (c) => <span className="text-sm font-mono text-xs">{c.whatsapp_group_id || '-'}</span>,
  },
  {
    key: 'ad_account_name',
    label: 'Conta de Anúncios',
    defaultVisible: false,
    minWidth: 'min-w-36',
    editType: 'text',
    render: (c) => <span className="text-sm">{c.ad_account_name || '-'}</span>,
  },
  {
    key: 'ad_account_id',
    label: 'ID Conta Ads',
    defaultVisible: false,
    minWidth: 'min-w-32',
    editType: 'text',
    render: (c) => <span className="text-sm font-mono text-xs">{c.ad_account_id || '-'}</span>,
  },
  {
    key: 'business_manager_id',
    label: 'BM ID',
    defaultVisible: false,
    minWidth: 'min-w-28',
    editType: 'text',
    render: (c) => <span className="text-sm font-mono text-xs">{c.business_manager_id || '-'}</span>,
  },
  {
    key: 'google_ads_id',
    label: 'Google Ads ID',
    defaultVisible: false,
    minWidth: 'min-w-28',
    editType: 'text',
    render: (c) => <span className="text-sm font-mono text-xs">{c.google_ads_id || '-'}</span>,
  },
  {
    key: 'status',
    label: 'Status Sistema',
    defaultVisible: false,
    minWidth: 'min-w-28',
    editType: 'select',
    editOptions: ['Ativo', 'Inativo'],
    render: (c) => <span className="text-sm">{c.status}</span>,
  },
]

// ─── Inline edit cell ─────────────────────────────────────────────────────────
interface InlineCellProps {
  col: ColDef
  client: Client
  onSave: (clientId: string, field: ColKey, value: unknown) => Promise<void>
}

function InlineCell({ col, client, onSave }: InlineCellProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState<string>(String(client[col.key] ?? ''))
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(String(client[col.key] ?? ''))
  }, [client, col.key])

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

  if (col.editType === 'none') {
    return <>{col.render(client)}</>
  }

  async function handleSave() {
    setSaving(true)
    let parsed: unknown = value
    if (col.editType === 'number') parsed = Number(value)
    if (col.editType === 'boolean') parsed = value === 'true'
    if (col.editType === 'date') parsed = value || null
    if (value === '' && col.editType !== 'number') parsed = null
    await onSave(client.id, col.key, parsed)
    setSaving(false)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setValue(String(client[col.key] ?? ''))
      setEditing(false)
    }
  }

  if (!editing) {
    return (
      <div
        className="group flex items-center gap-1 cursor-pointer rounded hover:bg-muted/50 px-1 -mx-1 min-h-[28px]"
        onClick={() => {
          if (col.key === 'month_status') {
            // cycle through colors
            const opts = ['green', 'yellow', 'red']
            const cur = opts.indexOf(String(client[col.key] ?? 'green'))
            const next = opts[(cur + 1) % opts.length]
            onSave(client.id, col.key, next)
          } else {
            setEditing(true)
          }
        }}
      >
        {col.render(client)}
        {col.key !== 'month_status' && (
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {col.editType === 'select' ? (
        <Select
          value={value}
          onValueChange={async (v) => {
            setValue(v)
            setSaving(true)
            await onSave(client.id, col.key, v)
            setSaving(false)
            setEditing(false)
          }}
          open
          onOpenChange={(o) => { if (!o) setEditing(false) }}
        >
          <SelectTrigger className="h-7 text-xs min-w-[100px] bg-background border-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {col.editOptions?.map((opt) => (
              <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <>
          <Input
            ref={inputRef}
            type={col.editType === 'number' ? 'number' : col.editType === 'date' ? 'date' : 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 text-xs w-[120px] bg-background border-primary"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-success hover:text-success/80 p-0.5"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => { setValue(String(client[col.key] ?? '')); setEditing(false) }}
            className="text-destructive hover:text-destructive/80 p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ClientsTable() {
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)

  // Visible columns — persisted to localStorage
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('clients_visible_cols')
        if (saved) return new Set(JSON.parse(saved))
      } catch {}
    }
    return new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key))
  })

  function toggleCol(key: ColKey) {
    setVisibleCols((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size === 1) return prev // keep at least 1
        next.delete(key)
      } else {
        next.add(key)
      }
      localStorage.setItem('clients_visible_cols', JSON.stringify([...next]))
      return next
    })
  }

  useEffect(() => { loadClients() }, [])

  useEffect(() => {
    const timeout = setTimeout(() => loadClients(), 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, statusFilter])

  async function loadClients() {
    startTransition(async () => {
      try {
        const data = await getClients({ status: statusFilter, search: searchQuery })
        setClients(data)
      } catch (error) {
        console.error('[v0] Error loading clients:', error)
      } finally {
        setIsLoading(false)
      }
    })
  }

  async function handleInlineSave(clientId: string, field: ColKey, value: unknown) {
    try {
      const client = clients.find((c) => c.id === clientId)
      if (!client) return
      const updated = { ...client, [field]: value }
      // optimistic update
      setClients((prev) => prev.map((c) => (c.id === clientId ? updated : c)))
      await updateClient(clientId, { [field]: value } as Partial<Client>)
    } catch (error) {
      console.error('[v0] Inline save error:', error)
      loadClients() // revert on error
    }
  }

  const activeCols = ALL_COLUMNS.filter((c) => visibleCols.has(c.key))

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-auto md:w-48 bg-secondary border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Pausado">Pausado</SelectItem>
                <SelectItem value="Perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>

            {/* Column picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-secondary border-border shrink-0">
                  <Columns3 className="h-4 w-4" />
                  Colunas ({visibleCols.size})
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-0">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium">Colunas visíveis</p>
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {ALL_COLUMNS.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-secondary rounded-none select-none"
                    >
                      <input
                        type="checkbox"
                        checked={visibleCols.has(col.key)}
                        onChange={() => toggleCol(col.key)}
                        className="rounded border-border"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 sm:p-6">
          <CardTitle className="text-lg flex items-center gap-2">
            Clientes ({clients.length})
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <ClientFormDialog onSuccess={loadClients} />
        </CardHeader>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    {activeCols.map((col) => (
                      <TableHead
                        key={col.key}
                        className={cn(col.minWidth, col.key === 'monthly_value' && 'text-right', col.key === 'month_status' && 'text-center')}
                      >
                        {col.label}
                      </TableHead>
                    ))}
                    <TableHead className="text-right min-w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="border-border group/row">
                      {activeCols.map((col) => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            col.key === 'monthly_value' && 'text-right',
                            col.key === 'month_status' && 'text-center',
                          )}
                        >
                          <InlineCell col={col} client={client} onSave={handleInlineSave} />
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <Link href={`/clientes/${encodeURIComponent(client.name)}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <ClientFormDialog
                            client={client}
                            onSuccess={loadClients}
                            trigger={
                              <Button variant="ghost" size="sm">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DeleteDialog
                            title="Excluir Cliente"
                            description={`Tem certeza que deseja excluir "${client.name}"? Esta ação não pode ser desfeita.`}
                            onConfirm={() => deleteClient(client.id)}
                            onSuccess={loadClients}
                            trigger={
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
