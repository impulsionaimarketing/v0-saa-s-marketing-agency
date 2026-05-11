'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createPipeline,
  updatePipeline,
  deletePipeline,
  duplicatePipeline,
  type CRMPipeline,
} from '@/lib/data/crm'
import { DeleteDialog } from '@/components/shared/delete-dialog'

const PIPELINE_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

interface CRMPipelineSelectorProps {
  pipelines: CRMPipeline[]
  activePipeline: CRMPipeline | null
  onSelect: (pipeline: CRMPipeline) => void
  onSuccess: () => void
}

export function CRMPipelineSelector({
  pipelines,
  activePipeline,
  onSelect,
  onSuccess,
}: CRMPipelineSelectorProps) {
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPipeline, setEditingPipeline] = useState<CRMPipeline | null>(null)
  const [deletingPipeline, setDeletingPipeline] = useState<CRMPipeline | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    color: PIPELINE_COLORS[0],
  })

  const openDialog = (pipeline?: CRMPipeline) => {
    if (pipeline) {
      setEditingPipeline(pipeline)
      setFormData({ name: pipeline.name, color: pipeline.color })
    } else {
      setEditingPipeline(null)
      setFormData({ name: '', color: PIPELINE_COLORS[0] })
    }
    setDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        if (editingPipeline) {
          await updatePipeline(editingPipeline.id, formData)
        } else {
          await createPipeline(formData)
        }
        setDialogOpen(false)
        onSuccess()
      } catch (error) {
        console.error('[CRM] Error saving pipeline:', error)
      }
    })
  }

  const handleDuplicate = async (pipeline: CRMPipeline) => {
    startTransition(async () => {
      try {
        await duplicatePipeline(pipeline.id)
        onSuccess()
      } catch (error) {
        console.error('[CRM] Error duplicating pipeline:', error)
      }
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deletingPipeline) return
    startTransition(async () => {
      try {
        await deletePipeline(deletingPipeline.id)
        setDeletingPipeline(null)
        onSuccess()
      } catch (error) {
        console.error('[CRM] Error deleting pipeline:', error)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[180px] justify-between">
            <div className="flex items-center gap-2">
              {activePipeline && (
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: activePipeline.color }}
                />
              )}
              <span className="truncate">
                {activePipeline?.name || 'Selecionar Funil'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 ml-2 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[250px]">
          {pipelines.map((pipeline) => (
            <DropdownMenuItem
              key={pipeline.id}
              className="flex items-center justify-between cursor-pointer"
              onClick={() => onSelect(pipeline)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: pipeline.color }}
                />
                <span className="truncate">{pipeline.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    openDialog(pipeline)
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDuplicate(pipeline)
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeletingPipeline(pipeline)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Funil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingPipeline ? 'Editar Funil' : 'Novo Funil'}
              </DialogTitle>
              <DialogDescription>
                {editingPipeline 
                  ? 'Atualize as informações do funil.' 
                  : 'Crie um novo funil para organizar seus leads.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Captação de Clientes"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {PIPELINE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        formData.color === color && 'ring-2 ring-offset-2 ring-primary'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingPipeline ? 'Salvar' : 'Criar Funil'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteDialog
        open={!!deletingPipeline}
        onOpenChange={(open) => !open && setDeletingPipeline(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Funil"
        description={`Tem certeza que deseja excluir o funil "${deletingPipeline?.name}"? Todas as colunas e leads serão excluídos. Esta ação não pode ser desfeita.`}
      />
    </>
  )
}
