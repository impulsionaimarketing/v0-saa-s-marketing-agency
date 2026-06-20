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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createLead,
  updateLead,
  type CRMLeadV2,
  type CRMColumn,
  type CRMTag,
  type LeadPriority,
  PRIORITY_CONFIG,
} from '@/lib/data/crm'

interface CRMLeadFormDialogProps {
  lead?: CRMLeadV2 | null
  pipelineId: string
  columnId?: string
  columns: CRMColumn[]
  tags: CRMTag[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CRMLeadFormDialog({
  lead,
  pipelineId,
  columnId,
  columns,
  tags,
  open,
  onOpenChange,
  onSuccess,
}: CRMLeadFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    whatsapp: '',
    email: '',
    value: '',
    priority: 'medium' as LeadPriority,
    column_id: columnId || columns[0]?.id || '',
    notes: '',
    tag_ids: [] as string[],
  })

  useEffect(() => {
    if (open) {
      if (lead) {
        setFormData({
          name: lead.name,
          company: lead.company || '',
          phone: lead.phone || '',
          whatsapp: lead.whatsapp || '',
          email: lead.email || '',
          value: lead.value?.toString() || '',
          priority: lead.priority,
          column_id: lead.column_id,
          notes: lead.notes || '',
          tag_ids: lead.tags?.map(t => t.id) || [],
        })
      } else {
        setFormData({
          name: '',
          company: '',
          phone: '',
          whatsapp: '',
          email: '',
          value: '',
          priority: 'medium',
          column_id: columnId || columns[0]?.id || '',
          notes: '',
          tag_ids: [],
        })
      }
    }
  }, [open, lead, columnId, columns])

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        const data = {
          name: formData.name,
          company: formData.company || null,
          phone: formData.phone || null,
          whatsapp: formData.whatsapp || null,
          email: formData.email || null,
          value: formData.value ? parseFloat(formData.value) : 0,
          priority: formData.priority,
          column_id: formData.column_id,
          notes: formData.notes || null,
          tag_ids: formData.tag_ids,
        }

        if (lead) {
          await updateLead(lead.id, data)
        } else {
          await createLead({
            ...data,
            pipeline_id: pipelineId,
          })
        }
        
        onOpenChange(false)
        onSuccess()
      } catch (error) {
        console.error('[CRM] Error saving lead:', error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {lead ? 'Editar Lead' : 'Novo Lead'}
            </DialogTitle>
            <DialogDescription>
              {lead 
                ? 'Atualize as informações do lead.' 
                : 'Preencha os dados do novo lead.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Name & Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lead-name">Nome *</Label>
                <Input
                  id="lead-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do lead"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-company">Empresa</Label>
                <Input
                  id="lead-company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Nome da empresa"
                />
              </div>
            </div>

            {/* Phone & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lead-phone">Telefone</Label>
                <Input
                  id="lead-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 0000-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-whatsapp">WhatsApp</Label>
                <Input
                  id="lead-whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {/* Email & Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lead-email">E-mail</Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-value">Valor Potencial</Label>
                <Input
                  id="lead-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Column & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lead-column">Coluna/Etapa</Label>
                <Select
                  value={formData.column_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, column_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: column.color }}
                          />
                          {column.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as LeadPriority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PRIORITY_CONFIG) as [LeadPriority, { label: string }][]).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-secondary/50 rounded-lg min-h-[60px]">
                {tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma tag disponível.</p>
                ) : (
                  tags.map((tag) => {
                    const isSelected = formData.tag_ids.includes(tag.id)
                    return (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className={cn(
                          'cursor-pointer transition-all',
                          isSelected && 'ring-2 ring-offset-1'
                        )}
                        style={{
                          backgroundColor: isSelected ? `${tag.color}30` : 'transparent',
                          borderColor: tag.color,
                          color: tag.color,
                        }}
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                        {isSelected && <X className="h-3 w-3 ml-1" />}
                      </Badge>
                    )
                  })
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="lead-notes">Observações</Label>
              <Textarea
                id="lead-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Anotações sobre o lead..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
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
              {lead ? 'Salvar' : 'Criar Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
