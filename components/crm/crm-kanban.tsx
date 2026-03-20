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
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Search,
  GripVertical,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  Phone,
  Mail,
  Building2,
  User,
  StickyNote,
} from 'lucide-react'
import {
  getCrmLeads,
  createCrmLead,
  updateCrmLead,
  updateCrmLeadStatus,
  deleteCrmLead,
  type CrmLead,
  type LeadStatus,
  type CreateLeadData,
  type UpdateLeadData,
} from '@/lib/data/crm-leads'
import { DeleteDialog } from '@/components/shared/delete-dialog'
import { cn } from '@/lib/utils'
import { useDragScroll } from '@/lib/hooks/use-drag-scroll'

// Column configuration
const columns: { id: LeadStatus; title: string; color: string }[] = [
  { id: 'lead_novo', title: 'Lead Novo', color: 'bg-blue-500' },
  { id: 'entrar_em_contato', title: 'Entrar em Contato', color: 'bg-amber-500' },
  { id: 'proposta_enviada', title: 'Proposta Enviada', color: 'bg-purple-500' },
  { id: 'contrato_ativo', title: 'Contrato Ativo', color: 'bg-green-500' },
  { id: 'contrato_pausado', title: 'Contrato Pausado', color: 'bg-orange-500' },
  { id: 'contrato_cancelado', title: 'Contrato Cancelado', color: 'bg-red-500' },
]

// Lead Form Dialog
function LeadFormDialog({
  open,
  onClose,
  lead,
  onSave,
}: {
  open: boolean
  onClose: () => void
  lead: CrmLead | null
  onSave: (data: CreateLeadData | UpdateLeadData) => Promise<void>
}) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    notes: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name,
        phone: lead.phone || '',
        email: lead.email || '',
        company: lead.company || '',
        notes: lead.notes || '',
      })
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        company: '',
        notes: '',
      })
    }
  }, [lead, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSaving(true)
    try {
      await onSave(formData)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{lead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do lead"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Nome da empresa"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Anotações sobre o lead..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !formData.name.trim()}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {lead ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Lead Detail Modal
function LeadDetailModal({
  lead,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  lead: CrmLead | null
  open: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  if (!lead) return null

  const statusInfo = columns.find((c) => c.id === lead.status)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-left leading-tight flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                {lead.name}
              </DialogTitle>
              <Badge
                className={cn('mt-2 text-xs text-white', statusInfo?.color)}
              >
                {statusInfo?.title}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {lead.company && (
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{lead.company}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={`tel:${lead.phone}`} className="text-sm text-primary hover:underline">
                {lead.phone}
              </a>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={`mailto:${lead.email}`} className="text-sm text-primary hover:underline">
                {lead.email}
              </a>
            </div>
          )}
          {lead.notes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <StickyNote className="h-4 w-4" />
                <span className="text-xs font-medium">Observações</span>
              </div>
              <p className="text-sm whitespace-pre-wrap bg-secondary/40 rounded-md p-3">
                {lead.notes}
              </p>
            </div>
          )}
          <div className="pt-2 border-t border-border text-xs text-muted-foreground">
            Criado em {new Date(lead.created_at).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main CRM Kanban Component
export function CrmKanban() {
  const [leads, setLeads] = useState<CrmLead[]>([])
  const [draggedItem, setDraggedItem] = useState<CrmLead | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal states
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<CrmLead | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState<CrmLead | null>(null)

  const { onDragStart: dragScrollStart, onDragEnd: dragScrollEnd } = useDragScroll()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const data = await getCrmLeads()
      setLeads(data)
    } catch (error) {
      console.error('[v0] Error loading CRM leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads
    const query = searchQuery.toLowerCase()
    return leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(query) ||
        lead.company?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query)
    )
  }, [leads, searchQuery])

  const getColumnLeads = (status: LeadStatus) =>
    filteredLeads.filter((lead) => lead.status === status)

  const handleDragStart = (e: React.DragEvent, lead: CrmLead) => {
    setDraggedItem(lead)
    e.dataTransfer.effectAllowed = 'move'
    dragScrollStart()
  }

  const handleDragEnd = () => {
    dragScrollEnd()
    setDraggedItem(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, columnId: LeadStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.status === newStatus) {
      setDraggedItem(null)
      setDragOverColumn(null)
      return
    }

    // Optimistic update
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === draggedItem.id ? { ...lead, status: newStatus } : lead
      )
    )

    // Persist change
    startTransition(async () => {
      try {
        await updateCrmLeadStatus(draggedItem.id, newStatus)
      } catch {
        loadData() // Revert on error
      }
    })

    setDraggedItem(null)
    setDragOverColumn(null)
  }

  const handleCreateLead = async (data: CreateLeadData) => {
    const newLead = await createCrmLead(data)
    setLeads((prev) => [newLead, ...prev])
  }

  const handleUpdateLead = async (data: UpdateLeadData) => {
    if (!editingLead) return
    const updated = await updateCrmLead(editingLead.id, data)
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    if (selectedLead?.id === updated.id) {
      setSelectedLead(updated)
    }
  }

  const handleDeleteLead = async () => {
    if (!leadToDelete) return
    await deleteCrmLead(leadToDelete.id)
    setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id))
    setDeleteOpen(false)
    setDetailOpen(false)
    setLeadToDelete(null)
    setSelectedLead(null)
  }

  const openNewLeadForm = () => {
    setEditingLead(null)
    setFormOpen(true)
  }

  const openEditForm = (lead: CrmLead) => {
    setEditingLead(lead)
    setFormOpen(true)
    setDetailOpen(false)
  }

  const openDeleteDialog = (lead: CrmLead) => {
    setLeadToDelete(lead)
    setDeleteOpen(true)
  }

  const openDetail = (lead: CrmLead) => {
    setSelectedLead(lead)
    setDetailOpen(true)
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
      {/* Modals */}
      <LeadFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        lead={editingLead}
        onSave={editingLead ? handleUpdateLead : handleCreateLead}
      />

      <LeadDetailModal
        lead={selectedLead}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={() => selectedLead && openEditForm(selectedLead)}
        onDelete={() => selectedLead && openDeleteDialog(selectedLead)}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteLead}
        title="Excluir Lead"
        description={`Tem certeza que deseja excluir o lead "${leadToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar lead..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <Button onClick={openNewLeadForm}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => {
            const columnLeads = getColumnLeads(column.id)
            const isDragOver = dragOverColumn === column.id

            return (
              <div
                key={column.id}
                className={cn(
                  'flex flex-col w-72 bg-secondary/30 rounded-xl transition-colors',
                  isDragOver && 'bg-secondary/60 ring-2 ring-primary/20'
                )}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="flex items-center gap-2 p-3 border-b border-border">
                  <div className={cn('w-3 h-3 rounded-full', column.color)} />
                  <h3 className="font-medium text-sm">{column.title}</h3>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {columnLeads.length}
                  </Badge>
                </div>

                {/* Column Content */}
                <div className="flex-1 p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
                  {columnLeads.map((lead) => (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={handleDragEnd}
                      onClick={() => openDetail(lead)}
                      className={cn(
                        'cursor-grab active:cursor-grabbing border-border hover:border-primary/30 transition-all',
                        draggedItem?.id === lead.id && 'opacity-50'
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{lead.name}</p>
                            {lead.company && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {lead.company}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              {lead.phone && (
                                <span className="flex items-center gap-1 truncate">
                                  <Phone className="h-3 w-3" />
                                  {lead.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {columnLeads.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                      Nenhum lead
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Loading indicator for transitions */}
      {isPending && (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Salvando...</span>
        </div>
      )}
    </>
  )
}
