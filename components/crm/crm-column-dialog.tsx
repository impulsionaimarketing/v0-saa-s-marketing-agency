'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
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
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createColumn, updateColumn, type CRMColumn } from '@/lib/data/crm'

const COLUMN_COLORS = [
  '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6',
  '#3b82f6', '#06b6d4', '#ec4899', '#84cc16', '#6b7280',
]

interface CRMColumnDialogProps {
  column?: CRMColumn | null
  pipelineId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CRMColumnDialog({
  column,
  pipelineId,
  open,
  onOpenChange,
  onSuccess,
}: CRMColumnDialogProps) {
  const [isPending, startTransition] = useTransition()
  
  const [formData, setFormData] = useState({
    name: '',
    color: COLUMN_COLORS[0],
    lead_limit: '',
  })

  useEffect(() => {
    if (open) {
      if (column) {
        setFormData({
          name: column.name,
          color: column.color,
          lead_limit: column.lead_limit?.toString() || '',
        })
      } else {
        setFormData({
          name: '',
          color: COLUMN_COLORS[Math.floor(Math.random() * COLUMN_COLORS.length)],
          lead_limit: '',
        })
      }
    }
  }, [open, column])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        const data = {
          name: formData.name,
          color: formData.color,
          lead_limit: formData.lead_limit ? parseInt(formData.lead_limit) : null,
        }

        if (column) {
          await updateColumn(column.id, data)
        } else {
          await createColumn({ ...data, pipeline_id: pipelineId })
        }
        
        onOpenChange(false)
        onSuccess()
      } catch (error) {
        console.error('[CRM] Error saving column:', error)
      }
    })
  }

  // Only render if explicitly open
  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {column ? 'Editar Coluna' : 'Nova Coluna'}
            </DialogTitle>
            <DialogDescription>
              {column 
                ? 'Atualize as informações da coluna.' 
                : 'Crie uma nova etapa para seu funil.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="col-name">Nome</Label>
              <Input
                id="col-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Novo Lead, Proposta Enviada..."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLUMN_COLORS.map((color) => (
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

            <div className="grid gap-2">
              <Label htmlFor="col-limit">Limite de Leads (opcional)</Label>
              <Input
                id="col-limit"
                type="number"
                min="0"
                value={formData.lead_limit}
                onChange={(e) => setFormData(prev => ({ ...prev, lead_limit: e.target.value }))}
                placeholder="Sem limite"
              />
              <p className="text-xs text-muted-foreground">
                Define um limite máximo de leads nesta coluna.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {column ? 'Salvar' : 'Criar Coluna'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
