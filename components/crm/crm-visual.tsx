'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Loader2,
  Plus,
  Phone,
  Mail,
  Building2,
  MoreVertical,
  GripVertical,
  Settings,
  Tag,
  Pencil,
  Trash2,
  Copy,
  ChevronDown,
  Filter,
  DollarSign,
  Clock,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import {
  getPipelines,
  getColumns,
  getLeads,
  getTags,
  moveLead,
  reorderLeads,
  reorderColumns,
  deleteLead,
  type CRMPipeline,
  type CRMColumn,
  type CRMLeadV2,
  type CRMTag,
  PRIORITY_CONFIG,
} from '@/lib/data/crm'
import { CRMLeadDetailSheet } from './crm-lead-detail-sheet'
import { CRMLeadFormDialog } from './crm-lead-form-dialog-v2'
import { CRMPipelineSelector } from './crm-pipeline-selector'
import { CRMColumnDialog } from './crm-column-dialog'
import { CRMTagsManager } from './crm-tags-manager'
import { CRMFilters } from './crm-filters'
import { DeleteDialog } from '@/components/shared/delete-dialog'

// ─── Sortable Lead Card ────────────────────────────────────────────────────────
function SortableLeadCard({
  lead,
  tags,
  onClick,
  onEdit,
  onDelete,
}: {
  lead: CRMLeadV2
  tags: CRMTag[]
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const leadTags = lead.tags || []

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'group cursor-pointer bg-card hover:bg-accent/50 border-border transition-all duration-200',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary rotate-2 scale-105 z-50'
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="shrink-0 p-0.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{lead.name}</p>
                {lead.company && (
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {lead.company}
                  </p>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Value & Priority */}
            <div className="flex items-center gap-2 mt-2">
              {lead.value > 0 && (
                <span className="text-xs font-medium text-success flex items-center gap-0.5">
                  <DollarSign className="h-3 w-3" />
                  {formatCurrency(lead.value)}
                </span>
              )}
              {lead.priority !== 'medium' && (
                <Badge 
                  variant="outline" 
                  className={cn('text-[10px] px-1.5 py-0', PRIORITY_CONFIG[lead.priority].color)}
                >
                  {PRIORITY_CONFIG[lead.priority].label}
                </Badge>
              )}
            </div>

            {/* Tags */}
            {leadTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {leadTags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: `${tag.color}20`, 
                      color: tag.color,
                      border: `1px solid ${tag.color}40`,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
                {leadTags.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{leadTags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Contact icons */}
            <div className="flex items-center gap-2 mt-2">
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-3 w-3" />
                </a>
              )}
              {lead.whatsapp && (
                <a
                  href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-green-500 transition-colors"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-3 w-3" />
                </a>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {new Date(lead.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Sortable Column ────────────────────────────────────────────────────────────
function SortableColumn({
  column,
  leads,
  tags,
  pipelineId,
  onLeadClick,
  onLeadEdit,
  onLeadDelete,
  onAddLead,
  onEditColumn,
  onDeleteColumn,
}: {
  column: CRMColumn
  leads: CRMLeadV2[]
  tags: CRMTag[]
  pipelineId: string
  onLeadClick: (lead: CRMLeadV2) => void
  onLeadEdit: (lead: CRMLeadV2) => void
  onLeadDelete: (lead: CRMLeadV2) => void
  onAddLead: (columnId: string) => void
  onEditColumn: (column: CRMColumn) => void
  onDeleteColumn: (column: CRMColumn) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `column-${column.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'w-[300px] shrink-0 flex flex-col',
        isDragging && 'opacity-50'
      )}
    >
      {/* Column Header */}
      <div 
        className="flex items-center justify-between mb-3 px-1"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <span className="font-medium text-sm truncate">{column.name}</span>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          {totalValue > 0 && (
            <span className="text-xs text-muted-foreground">
              {formatCurrency(totalValue)}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAddLead(column.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Lead
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditColumn(column)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar Coluna
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDeleteColumn(column)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Coluna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 bg-secondary/30 rounded-lg p-2 min-h-[200px]">
        <SortableContext
          items={leads.map(l => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {leads.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                <p>Nenhum lead</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-xs"
                  onClick={() => onAddLead(column.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>
            ) : (
              leads.map((lead) => (
                <SortableLeadCard
                  key={lead.id}
                  lead={lead}
                  tags={tags}
                  onClick={() => onLeadClick(lead)}
                  onEdit={() => onLeadEdit(lead)}
                  onDelete={() => onLeadDelete(lead)}
                />
              ))
            )}
          </div>
        </SortableContext>
        
        {leads.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onAddLead(column.id)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar Lead
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Lead Card Overlay (for drag preview) ────────────────────────────────────
function LeadCardOverlay({ lead }: { lead: CRMLeadV2 }) {
  return (
    <Card className="w-[280px] bg-card border-primary shadow-lg">
      <CardContent className="p-3">
        <p className="font-medium text-sm truncate">{lead.name}</p>
        {lead.company && (
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
            <Building2 className="h-3 w-3" />
            {lead.company}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main CRM Visual Component ────────────────────────────────────────────────
export function CRMVisual() {
  const [pipelines, setPipelines] = useState<CRMPipeline[]>([])
  const [activePipeline, setActivePipeline] = useState<CRMPipeline | null>(null)
  const [columns, setColumns] = useState<CRMColumn[]>([])
  const [leads, setLeads] = useState<CRMLeadV2[]>([])
  const [tags, setTags] = useState<CRMTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filters
  const [filterTagIds, setFilterTagIds] = useState<string[]>([])
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  
  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeLead, setActiveLead] = useState<CRMLeadV2 | null>(null)
  
  // Modals
  const [selectedLead, setSelectedLead] = useState<CRMLeadV2 | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<CRMLeadV2 | null>(null)
  const [deletingLead, setDeletingLead] = useState<CRMLeadV2 | null>(null)
  const [addLeadColumnId, setAddLeadColumnId] = useState<string | null>(null)
  const [editingColumn, setEditingColumn] = useState<CRMColumn | null | 'new'>(null)
  const [deletingColumn, setDeletingColumn] = useState<CRMColumn | null>(null)
  const [showTagsManager, setShowTagsManager] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load initial data
  useEffect(() => {
    loadPipelines()
    loadTags()
  }, [])

  // Load columns and leads when pipeline changes
  useEffect(() => {
    if (activePipeline) {
      loadColumnsAndLeads(activePipeline.id)
    }
  }, [activePipeline])

  async function loadPipelines() {
    try {
      const data = await getPipelines()
      setPipelines(data)
      if (data.length > 0 && !activePipeline) {
        setActivePipeline(data[0])
      }
    } catch (error) {
      console.error('[CRM] Error loading pipelines:', error)
    }
  }

  async function loadTags() {
    try {
      const data = await getTags()
      setTags(data)
    } catch (error) {
      console.error('[CRM] Error loading tags:', error)
    }
  }

  async function loadColumnsAndLeads(pipelineId: string) {
    setIsLoading(true)
    try {
      const [columnsData, leadsData] = await Promise.all([
        getColumns(pipelineId),
        getLeads(pipelineId),
      ])
      setColumns(columnsData)
      setLeads(leadsData)
    } catch (error) {
      console.error('[CRM] Error loading columns and leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter leads
  const filteredLeads = useMemo(() => {
    let result = leads

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(lead =>
        lead.name.toLowerCase().includes(query) ||
        lead.company?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.includes(query)
      )
    }

    // Tag filter
    if (filterTagIds.length > 0) {
      result = result.filter(lead =>
        lead.tags?.some(tag => filterTagIds.includes(tag.id))
      )
    }

    // Priority filter
    if (filterPriority) {
      result = result.filter(lead => lead.priority === filterPriority)
    }

    return result
  }, [leads, searchQuery, filterTagIds, filterPriority])

  // Get leads by column
  const getColumnLeads = useCallback((columnId: string) => {
    return filteredLeads
      .filter(lead => lead.column_id === columnId)
      .sort((a, b) => a.position - b.position)
  }, [filteredLeads])

  // Drag handlers
  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    setActiveId(active.id as string)
    
    // Find the lead being dragged
    const lead = leads.find(l => l.id === active.id)
    if (lead) {
      setActiveLead(lead)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    
    setActiveId(null)
    setActiveLead(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Handle column reordering
    if (activeId.startsWith('column-') && overId.startsWith('column-')) {
      const oldColumnId = activeId.replace('column-', '')
      const newColumnId = overId.replace('column-', '')
      
      if (oldColumnId !== newColumnId) {
        const oldIndex = columns.findIndex(c => c.id === oldColumnId)
        const newIndex = columns.findIndex(c => c.id === newColumnId)
        
        const newColumns = arrayMove(columns, oldIndex, newIndex)
        setColumns(newColumns)
        
        // Persist
        await reorderColumns(newColumns.map(c => c.id))
      }
      return
    }

    // Handle lead movement
    const draggedLead = leads.find(l => l.id === activeId)
    if (!draggedLead) return

    // Find the target column
    let targetColumnId: string | null = null
    let targetPosition = 0

    // Check if dropped on a column
    if (overId.startsWith('column-')) {
      targetColumnId = overId.replace('column-', '')
      const columnLeads = getColumnLeads(targetColumnId)
      targetPosition = columnLeads.length
    } else {
      // Dropped on another lead
      const overLead = leads.find(l => l.id === overId)
      if (overLead) {
        targetColumnId = overLead.column_id
        const columnLeads = getColumnLeads(targetColumnId)
        targetPosition = columnLeads.findIndex(l => l.id === overId)
      }
    }

    if (!targetColumnId) return

    // Update local state
    const updatedLeads = leads.map(lead => {
      if (lead.id === activeId) {
        return { ...lead, column_id: targetColumnId!, position: targetPosition }
      }
      return lead
    })
    setLeads(updatedLeads)

    // Persist
    try {
      await moveLead(activeId, targetColumnId, targetPosition)
    } catch (error) {
      console.error('[CRM] Error moving lead:', error)
      // Reload on error
      if (activePipeline) {
        loadColumnsAndLeads(activePipeline.id)
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Skip column dragging
    if (activeId.startsWith('column-')) return

    const draggedLead = leads.find(l => l.id === activeId)
    if (!draggedLead) return

    let targetColumnId: string | null = null

    if (overId.startsWith('column-')) {
      targetColumnId = overId.replace('column-', '')
    } else {
      const overLead = leads.find(l => l.id === overId)
      if (overLead) {
        targetColumnId = overLead.column_id
      }
    }

    if (targetColumnId && targetColumnId !== draggedLead.column_id) {
      // Move lead to new column
      setLeads(prev => prev.map(lead => {
        if (lead.id === activeId) {
          return { ...lead, column_id: targetColumnId! }
        }
        return lead
      }))
    }
  }

  // Actions
  const handleLeadClick = (lead: CRMLeadV2) => {
    setSelectedLead(lead)
    setDetailOpen(true)
  }

  const handleLeadEdit = (lead: CRMLeadV2) => {
    setEditingLead(lead)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingLead) return
    try {
      await deleteLead(deletingLead.id)
      setLeads(prev => prev.filter(l => l.id !== deletingLead.id))
      setDeletingLead(null)
    } catch (error) {
      console.error('[CRM] Error deleting lead:', error)
    }
  }

  const handleColumnDeleteConfirm = async () => {
    if (!deletingColumn || !activePipeline) return
    try {
      const { deleteColumn } = await import('@/lib/data/crm')
      await deleteColumn(deletingColumn.id)
      setColumns(prev => prev.filter(c => c.id !== deletingColumn.id))
      setDeletingColumn(null)
    } catch (error) {
      console.error('[CRM] Error deleting column:', error)
    }
  }

  const handleSuccess = () => {
    if (activePipeline) {
      loadColumnsAndLeads(activePipeline.id)
    }
  }

  if (isLoading && pipelines.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Lead Detail Sheet */}
      <CRMLeadDetailSheet
        lead={selectedLead}
        tags={tags}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={() => selectedLead && handleLeadEdit(selectedLead)}
        onDelete={() => selectedLead && setDeletingLead(selectedLead)}
        onSuccess={handleSuccess}
      />

      {/* Lead Form Dialog */}
      {(editingLead || addLeadColumnId) && activePipeline && (
        <CRMLeadFormDialog
          lead={editingLead}
          pipelineId={activePipeline.id}
          columnId={addLeadColumnId || editingLead?.column_id}
          columns={columns}
          tags={tags}
          open={!!editingLead || !!addLeadColumnId}
          onOpenChange={(open) => {
            if (!open) {
              setEditingLead(null)
              setAddLeadColumnId(null)
            }
          }}
          onSuccess={() => {
            handleSuccess()
            setEditingLead(null)
            setAddLeadColumnId(null)
          }}
        />
      )}

      {/* Column Dialog */}
      {activePipeline && (editingColumn === 'new' || (editingColumn && editingColumn !== null)) && (
        <CRMColumnDialog
          column={editingColumn === 'new' ? null : editingColumn}
          pipelineId={activePipeline.id}
          open={true}
          onOpenChange={(open) => !open && setEditingColumn(null)}
          onSuccess={() => {
            handleSuccess()
            setEditingColumn(null)
          }}
        />
      )}

      {/* Tags Manager */}
      <CRMTagsManager
        tags={tags}
        open={showTagsManager}
        onClose={() => setShowTagsManager(false)}
        onSuccess={loadTags}
      />

      {/* Delete Dialogs */}
      <DeleteDialog
        open={!!deletingLead}
        onOpenChange={(open) => !open && setDeletingLead(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Lead"
        description={`Tem certeza que deseja excluir "${deletingLead?.name}"? Esta ação não pode ser desfeita.`}
      />

      <DeleteDialog
        open={!!deletingColumn}
        onOpenChange={(open) => !open && setDeletingColumn(null)}
        onConfirm={handleColumnDeleteConfirm}
        title="Excluir Coluna"
        description={`Tem certeza que deseja excluir a coluna "${deletingColumn?.name}"? Todos os leads serão movidos para a primeira coluna.`}
      />

      {/* Header */}
      <Card className="bg-card border-border mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full lg:w-auto">
              {/* Pipeline Selector */}
              <CRMPipelineSelector
                pipelines={pipelines}
                activePipeline={activePipeline}
                onSelect={setActivePipeline}
                onSuccess={loadPipelines}
              />

              {/* Search */}
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
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              {/* Filters */}
              <CRMFilters
                tags={tags}
                filterTagIds={filterTagIds}
                filterPriority={filterPriority}
                onTagsChange={setFilterTagIds}
                onPriorityChange={setFilterPriority}
              />

              {/* Settings */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowTagsManager(true)}>
                    <Tag className="h-4 w-4 mr-2" />
                    Gerenciar Tags
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditingColumn('new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Coluna
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add Lead */}
              {columns.length > 0 && (
                <Button onClick={() => setAddLeadColumnId(columns[0].id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lead
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : columns.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <p className="text-muted-foreground mb-4">
            Nenhuma coluna criada ainda.
          </p>
          <Button onClick={() => setEditingColumn('new')}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Coluna
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <ScrollArea className="flex-1 pb-4">
            <div className="flex gap-4 min-w-max pb-4">
              <SortableContext
                items={columns.map(c => `column-${c.id}`)}
                strategy={horizontalListSortingStrategy}
              >
                {columns.map((column) => (
                  <SortableColumn
                    key={column.id}
                    column={column}
                    leads={getColumnLeads(column.id)}
                    tags={tags}
                    pipelineId={activePipeline?.id || ''}
                    onLeadClick={handleLeadClick}
                    onLeadEdit={handleLeadEdit}
                    onLeadDelete={setDeletingLead}
                    onAddLead={setAddLeadColumnId}
                    onEditColumn={setEditingColumn}
                    onDeleteColumn={setDeletingColumn}
                  />
                ))}
              </SortableContext>

              {/* Add Column Button */}
              <div className="w-[300px] shrink-0">
                <Button
                  variant="outline"
                  className="w-full h-12 border-dashed"
                  onClick={() => setEditingColumn('new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Coluna
                </Button>
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <DragOverlay>
            {activeLead && <LeadCardOverlay lead={activeLead} />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
