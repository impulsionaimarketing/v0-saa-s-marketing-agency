'use client'

import { ResponsibleBadge } from './responsible-select'
import React, { useState, useMemo, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  X,
  Loader2,
  Pencil,
  Trash2,
  GripVertical,
  Plus,
  Phone,
  Mail,
  Building2,
  MoreVertical,
  ExternalLink,
  Calendar,
} from 'lucide-react'
import {
  getCRMCards,
  updateCRMCardStatus,
  deleteCRMLead,
} from '@/lib/data/crm-leads'
import { getClientById, type Client } from '@/lib/data/clients'
import { ClientFormDialog } from '@/components/clients/client-form-dialog'
import {
  type CRMCard,
  type CRMStatus,
  CRM_STATUS_CONFIG,
  CRM_COLUMNS,
  CRM_TO_CONTRACT_STATUS,
  CRM_SERVICES,
  formatCurrencyBRL,
} from '@/lib/data/crm-config'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CRMLeadFormDialog, CRMLeadFormDialogControlled } from './crm-lead-form-dialog'
import { DeleteDialog } from '@/components/shared/delete-dialog'
import { cn } from '@/lib/utils'
import { useDragScroll } from '@/lib/hooks/use-drag-scroll'
import { toast } from 'sonner'

// ─── Lead Detail Modal ────────────────────────────────────────────────────────
function LeadDetailModal({
  lead,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  lead: CRMCard | null
  open: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  if (!lead) return null

  const statusConfig = CRM_STATUS_CONFIG[lead.status]
  const isClient = lead.entity === 'client'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-left leading-tight">{lead.name}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className={cn('text-xs', statusConfig.color)}>
                  {statusConfig.label}
                </Badge>
                {isClient && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                    Cliente
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              {!isClient && (
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {lead.company && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Empresa</p>
                <p className="font-medium flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  {lead.company}
                </p>
              </div>
            )}
            {lead.phone && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                <a
                  href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium flex items-center gap-1 text-primary hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {lead.email && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">E-mail</p>
                <a
                  href={`mailto:${lead.email}`}
                  className="font-medium flex items-center gap-1 text-primary hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  {lead.email}
                </a>
              </div>
            )}
            {lead.source && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Origem</p>
                <p className="font-medium">{lead.source}</p>
              </div>
            )}
            {(lead.recurringValue || 0) > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Valor recorrente (mês)</p>
                <p className="font-semibold text-primary">{formatCurrencyBRL(lead.recurringValue || 0)}</p>
              </div>
            )}
            {(lead.specificValue || 0) > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Valor específico (pontual)</p>
                <p className="font-semibold text-primary">{formatCurrencyBRL(lead.specificValue || 0)}</p>
              </div>
            )}
            {!isClient && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Responsável</p>
                <ResponsibleBadge name={lead.responsible_name} className="text-sm" />
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Criado em</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {new Date(lead.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {lead.notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Observações</p>
              <p className="text-sm whitespace-pre-wrap bg-secondary/40 rounded-md p-3">
                {lead.notes}
              </p>
            </div>
          )}

          {lead.clientServices && lead.clientServices.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Serviços contratados</p>
              <div className="space-y-1.5">
                {lead.clientServices.map((svc) => (
                  <div key={svc.name} className="flex items-center justify-between gap-2 rounded-md bg-secondary/40 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">
                      {svc.kind === 'recorrente' ? '↻ ' : ''}{svc.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {svc.kind === 'recorrente' ? 'Recorrente' : 'Específico'}
                      </span>
                    </span>
                    <span className="font-semibold text-primary shrink-0">
                      {formatCurrencyBRL(svc.value)}{svc.kind === 'recorrente' ? '/mês' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!lead.clientServices?.length && lead.services && lead.services.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Serviços desejados</p>
              <div className="flex flex-wrap gap-1.5">
                {lead.services.map((service) => (
                  <Badge
                    key={service}
                    variant="outline"
                    className="text-xs bg-primary/10 text-primary border-primary/30"
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Lead Card ────────────────────────────────────────────────────────────────
function LeadCard({
  lead,
  onDragStart,
  onDragEnd,
  onDragOver,
  isDragging,
  isDragOver,
  onClick,
  onEdit,
  onDelete,
}: {
  lead: CRMCard
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  isDragging: boolean
  isDragOver: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const isClient = lead.entity === 'client'
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onClick={onClick}
      className={cn(
        'cursor-pointer hover:border-primary/50 transition-all',
        isDragging && 'opacity-50 rotate-2 scale-105',
        isDragOver && 'border-primary border-2'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{lead.name}</p>
              {lead.company && !isClient && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3" />
                  {lead.company}
                </p>
              )}
              {!isClient && <ResponsibleBadge name={lead.responsible_name} className="mt-1" />}
            </div>
          </div>
          {(
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                {!isClient && (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {lead.phone && (
            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <Phone className="h-3 w-3" />
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <Mail className="h-3 w-3" />
            </a>
          )}
          {lead.source && (
            <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
              {lead.source}
            </span>
          )}
        </div>

        {((lead.recurringValue || 0) > 0 || (lead.specificValue || 0) > 0) && (
          <div className="mt-2 space-y-0.5 text-sm font-semibold text-primary">
            {(lead.recurringValue || 0) > 0 && <p>↻ {formatCurrencyBRL(lead.recurringValue || 0)}/mês</p>}
            {(lead.specificValue || 0) > 0 && <p>{formatCurrencyBRL(lead.specificValue || 0)} pontual</p>}
          </div>
        )}

        {lead.services && lead.services.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lead.services.map((service) => {
              const svc = lead.clientServices?.find((s) => s.name === service)
              const kind = svc?.kind
              const svcValue = svc?.value ?? 0
              return (
                <span
                  key={service}
                  className={cn(
                    'text-[10px] border px-1.5 py-0.5 rounded',
                    kind === 'especifico'
                      ? 'bg-chart-4/10 text-chart-4 border-chart-4/30'
                      : 'bg-primary/10 text-primary border-primary/30',
                  )}
                >
                  {kind === 'recorrente' ? '↻ ' : ''}{service}
                  {svcValue ? ` · ${formatCurrencyBRL(svcValue)}${kind === 'recorrente' ? '/mês' : ''}` : kind === 'especifico' ? ' · pontual' : ''}
                </span>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main CRM Kanban ──────────────────────────────────────────────────────────
interface CRMKanbanProps {
  initialCards?: CRMCard[]
}

export function CRMKanban({ initialCards = [] }: CRMKanbanProps) {
  const [leads, setLeads] = useState<CRMCard[]>(Array.isArray(initialCards) ? initialCards : [])
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  
  // Drag state
  const [draggedItem, setDraggedItem] = useState<CRMCard | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const { onDragStart: dragScrollStart, onDragEnd: dragScrollEnd } = useDragScroll()
  
  // Detail modal
  const [selectedLead, setSelectedLead] = useState<CRMCard | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  
  // Edit modal
  const [editingLead, setEditingLead] = useState<CRMCard | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  
  // Delete dialog
  const [deletingLead, setDeletingLead] = useState<CRMCard | null>(null)

  async function loadLeads() {
    try {
      const data = await getCRMCards()
      // Ensure data is always an array
      setLeads(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('[v0] Error loading CRM cards:', error)
      setLeads([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLeads = useMemo(() => {
    let result = leads

    if (serviceFilter !== 'all') {
      result = result.filter((lead) => lead.services?.includes(serviceFilter))
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          lead.company?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.source?.toLowerCase().includes(query)
      )
    }

    return result
  }, [leads, searchQuery, serviceFilter])

  const getColumnLeads = (status: CRMStatus) =>
    filteredLeads.filter((lead) => lead.status === status)

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, lead: CRMCard) => {
    setDraggedItem(lead)
    e.dataTransfer.effectAllowed = 'move'
    dragScrollStart()
  }

  const handleDragEnd = () => {
    dragScrollEnd()
    setDraggedItem(null)
    setDragOverId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleCardDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedItem?.id !== targetId) setDragOverId(targetId)
  }

  const handleDrop = (e: React.DragEvent, newStatus: CRMStatus) => {
    e.preventDefault()
    if (!draggedItem) return

    const card = draggedItem
    const oldStatus = card.status

    // Clientes só podem ser movidos entre as colunas de contrato
    if (card.entity === 'client' && !CRM_TO_CONTRACT_STATUS[newStatus]) {
      toast.error('Clientes só podem ser movidos entre Contrato Ativo, Pausado e Perdido.')
      setDraggedItem(null)
      setDragOverId(null)
      return
    }

    // Optimistic update
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === card.id ? { ...lead, status: newStatus } : lead
      )
    )

    // Persist if status changed
    if (oldStatus !== newStatus) {
      startTransition(async () => {
        try {
          await updateCRMCardStatus(card.id, card.entity, newStatus)
        } catch {
          // Rollback on error
          loadLeads()
        }
      })
    }

    setDraggedItem(null)
    setDragOverId(null)
  }

  // Actions
  const openDetail = (lead: CRMCard) => {
    setSelectedLead(lead)
    setDetailOpen(true)
  }

  const handleEdit = async (lead: CRMCard) => {
    setDetailOpen(false)
    if (lead.entity === 'client') {
      const full = await getClientById(lead.id)
      if (full) setEditingClient(full)
      return
    }
    setEditingLead(lead)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingLead) return
    try {
      await deleteCRMLead(deletingLead.id)
      setLeads((prev) => prev.filter((l) => l.id !== deletingLead.id))
      setDeletingLead(null)
      setDetailOpen(false)
    } catch (error) {
      console.error('[v0] Error deleting lead:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {/* Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={() => selectedLead && handleEdit(selectedLead)}
        onDelete={() => {
          if (selectedLead) setDeletingLead(selectedLead)
        }}
      />

      {/* Edit Modal - controlled externally */}
      <CRMLeadFormDialogControlled
        lead={editingLead}
        open={!!editingLead}
        onOpenChange={(open) => !open && setEditingLead(null)}
        onSuccess={() => {
          loadLeads()
          setEditingLead(null)
        }}
      />

      {/* Edição de cliente (mesmo formulário da aba Clientes) */}
      <ClientFormDialog
        client={editingClient}
        open={!!editingClient}
        onOpenChange={(o) => !o && setEditingClient(null)}
        onSuccess={() => {
          loadLeads()
          setEditingClient(null)
        }}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={!!deletingLead}
        onOpenChange={(open) => !open && setDeletingLead(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Lead"
        description={`Tem certeza que deseja excluir "${deletingLead?.name}"? Esta ação não pode ser desfeita.`}
      />

      {/* Filters: tudo em uma linha */}
      <div className="mb-4 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn('shrink-0 bg-secondary border-border', searchQuery && !searchOpen && 'border-primary text-primary')}
          aria-label={searchOpen ? 'Fechar busca' : 'Buscar'}
          onClick={() => {
            if (searchOpen) setSearchQuery('')
            setSearchOpen((v) => !v)
          }}
        >
          {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </Button>
        {searchOpen ? (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              type="search"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
        ) : (
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="flex-1 bg-secondary border-border">
              <SelectValue placeholder="Filtrar por serviço" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os serviços</SelectItem>
              {CRM_SERVICES.map((service) => (
                <SelectItem key={service} value={service}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <CRMLeadFormDialog
          onSuccess={loadLeads}
          trigger={
            <Button type="button" size="icon" className="shrink-0 bg-primary text-primary-foreground" aria-label="Adicionar lead">
              <Plus className="h-5 w-5" />
            </Button>
          }
        />
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {CRM_COLUMNS.map((column) => {
            const columnLeads = getColumnLeads(column.id)
            const statusConfig = CRM_STATUS_CONFIG[column.id]
            const columnTotal = columnLeads.reduce((sum, lead) => sum + (lead.value || 0), 0)
            const recurringTotal = columnLeads.reduce((sum, lead) => sum + (lead.recurringValue || 0), 0)
            const specificTotal = columnLeads.reduce((sum, lead) => sum + (lead.specificValue || 0), 0)

            return (
              <div
                key={column.id}
                className="w-72 shrink-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-xs font-medium', statusConfig.color)}>
                        {column.title}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({columnLeads.length})
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-primary px-0.5">
                      {formatCurrencyBRL(columnTotal)}
                    </span>
                    {(recurringTotal > 0 || specificTotal > 0) && (
                      <span className="text-[11px] text-muted-foreground px-0.5">
                        ↻ {formatCurrencyBRL(recurringTotal)}/mês · pontual {formatCurrencyBRL(specificTotal)}
                      </span>
                    )}
                  </div>
                  <CRMLeadFormDialog
                    defaultStatus={column.id}
                    onSuccess={loadLeads}
                    trigger={
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>

                {/* Column Content */}
                <div className="space-y-2 min-h-[200px] bg-secondary/30 rounded-lg p-2">
                  {columnLeads.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      Nenhum lead
                    </p>
                  ) : (
                    columnLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleCardDragOver(e, lead.id)}
                        isDragging={draggedItem?.id === lead.id}
                        isDragOver={dragOverId === lead.id}
                        onClick={() => openDetail(lead)}
                        onEdit={() => handleEdit(lead)}
                        onDelete={() => setDeletingLead(lead)}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </>
  )
}
