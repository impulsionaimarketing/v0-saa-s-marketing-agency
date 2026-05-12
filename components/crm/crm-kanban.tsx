'use client'

import React, { useState, useEffect, useMemo, useTransition } from 'react'
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
  DollarSign,
  Users,
} from 'lucide-react'
import {
  getCRMLeads,
  getCRMClients,
  clientToCRMLead,
  updateCRMLeadStatus,
  updateClientStatus,
  deleteCRMLead,
  type CRMLead,
  type CRMStatus,
  CRM_STATUS_CONFIG,
  CRM_COLUMNS,
  CLIENT_ALLOWED_STATUSES,
} from '@/lib/data/crm-leads'
import { CRMLeadFormDialog, CRMLeadFormDialogControlled } from './crm-lead-form-dialog'
import { DeleteDialog } from '@/components/shared/delete-dialog'
import { cn } from '@/lib/utils'
import { useDragScroll } from '@/lib/hooks/use-drag-scroll'

// ─── Lead Detail Modal ────────────────────────────────────────────────────────
function LeadDetailModal({
  lead,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  lead: CRMLead | null
  open: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  if (!lead) return null

  const statusConfig = CRM_STATUS_CONFIG[lead.status]

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
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Value */}
          {lead.value > 0 && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Valor</p>
              <p className="text-lg font-bold text-success flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
              </p>
            </div>
          )}

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
  lead: CRMLead
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  isDragging: boolean
  isDragOver: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const isClient = lead.isClient

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
        isDragOver && 'border-primary border-2',
        isClient && 'border-chart-4/30 bg-chart-4/5'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{lead.name}</p>
              {lead.company && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3" />
                  {lead.company}
                </p>
              )}
            </div>
          </div>
          {!isClient && (
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
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Value display */}
        {lead.value > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-success">
            <DollarSign className="h-3 w-3" />
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {lead.isClient && (
            <span className="inline-flex items-center gap-1 text-xs text-chart-4 bg-chart-4/10 px-1.5 py-0.5 rounded">
              <Users className="h-3 w-3" />
              Cliente
            </span>
          )}
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
          {lead.source && !lead.isClient && (
            <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
              {lead.source}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main CRM Kanban ──────────────────────────────────────────────────────────
export function CRMKanban() {
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Drag state
  const [draggedItem, setDraggedItem] = useState<CRMLead | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const { onDragStart: dragScrollStart, onDragEnd: dragScrollEnd } = useDragScroll()
  
  // Detail modal
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  
  // Edit modal
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null)
  
  // Delete dialog
  const [deletingLead, setDeletingLead] = useState<CRMLead | null>(null)

  useEffect(() => {
    loadLeads()
  }, [])

  async function loadLeads() {
    try {
      // Buscar leads do CRM e clientes em paralelo
      const [leadsData, clientsData] = await Promise.all([
        getCRMLeads(),
        getCRMClients(),
      ])

      // Garantir que são arrays
      const leads = Array.isArray(leadsData) ? leadsData : []
      const clients = Array.isArray(clientsData) ? clientsData : []

      // Converter clientes para o formato de CRMLead
      const clientLeads = clients.map(clientToCRMLead)

      // Combinar leads e clientes, evitando duplicatas
      // Clientes vêm do sistema de clientes, então ficam nas colunas de contrato
      const allLeads = [...leads, ...clientLeads]

      setLeads(allLeads)
    } catch (error) {
      console.error('[v0] Error loading leads:', error)
      setLeads([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads
    const query = searchQuery.toLowerCase()
    return leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(query) ||
        lead.company?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.source?.toLowerCase().includes(query)
    )
  }, [leads, searchQuery])

  const getColumnLeads = (status: CRMStatus) =>
    filteredLeads.filter((lead) => lead.status === status)

  // Calcular soma dos valores por coluna
  const getColumnTotal = (status: CRMStatus) => {
    const columnLeads = getColumnLeads(status)
    return columnLeads.reduce((sum, lead) => sum + (lead.value || 0), 0)
  }

  // Formatar valor em BRL
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, lead: CRMLead) => {
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

    const isClient = draggedItem.isClient
    const clientId = draggedItem.clientId

    // Clientes só podem ser movidos para colunas de contrato
    if (isClient && !CLIENT_ALLOWED_STATUSES.includes(newStatus)) {
      setDraggedItem(null)
      setDragOverId(null)
      return
    }

    const oldStatus = draggedItem.status

    // Optimistic update
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === draggedItem.id ? { ...lead, status: newStatus } : lead
      )
    )

    // Persist if status changed
    if (oldStatus !== newStatus) {
      startTransition(async () => {
        try {
          if (isClient && clientId) {
            // Atualizar status na tabela de clientes
            await updateClientStatus(clientId, newStatus)
          } else {
            // Atualizar status na tabela de leads do CRM
            await updateCRMLeadStatus(draggedItem.id, newStatus)
          }
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
  const openDetail = (lead: CRMLead) => {
    setSelectedLead(lead)
    setDetailOpen(true)
  }

  const handleEdit = (lead: CRMLead) => {
    setEditingLead(lead)
    setDetailOpen(false)
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

      {/* Delete Dialog */}
      <DeleteDialog
        open={!!deletingLead}
        onOpenChange={(open) => !open && setDeletingLead(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Lead"
        description={`Tem certeza que deseja excluir "${deletingLead?.name}"? Esta ação não pode ser desfeita.`}
      />

      {/* Filters */}
      <Card className="bg-card border-border mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
            <CRMLeadFormDialog onSuccess={loadLeads} />
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {CRM_COLUMNS.map((column) => {
            const columnLeads = getColumnLeads(column.id)
            const statusConfig = CRM_STATUS_CONFIG[column.id]
            const columnTotal = getColumnTotal(column.id)

            return (
              <div
                key={column.id}
                className="w-72 shrink-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="mb-3 px-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('text-xs font-medium', statusConfig.color)}>
                        {column.title}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({columnLeads.length})
                      </span>
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
                  {/* Column Total */}
                  {columnTotal > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs font-medium text-success">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(columnTotal)}
                    </div>
                  )}
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
