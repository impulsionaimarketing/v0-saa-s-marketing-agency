'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { ResponsibleSelect } from './responsible-select'
import {
  createCRMLead,
  updateCRMLead,
} from '@/lib/data/crm-leads'
import {
  type CRMLead,
  type CRMStatus,
  CRM_STATUS_CONFIG,
  CRM_SERVICES,
} from '@/lib/data/crm-config'

interface CRMLeadFormDialogProps {
  lead?: CRMLead | null
  onSuccess?: () => void
  trigger?: React.ReactNode
  defaultStatus?: CRMStatus
}

interface CRMLeadFormDialogControlledProps {
  lead?: CRMLead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// Lead antigo (sem divisão de valores): a proposta conta como recorrente
function initialRecurring(lead?: { recurring_value?: number; specific_value?: number; proposal_value?: number } | null) {
  if (!lead) return ''
  const recurring = Number(lead.recurring_value) || 0
  if (recurring > 0) return String(recurring)
  if (Number(lead.specific_value) > 0) return ''
  return lead.proposal_value ? String(lead.proposal_value) : ''
}

export function CRMLeadFormDialog({ lead, onSuccess, trigger, defaultStatus }: CRMLeadFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    source: '',
    notes: '',
    recurring_value: '',
    specific_value: '',
    services: [] as string[],
    responsible_id: '',
    status: (defaultStatus || 'lead_novo') as CRMStatus,
  })

  useEffect(() => {
    if (open) {
      setFormData({
        name: lead?.name || '',
        phone: lead?.phone || '',
        email: lead?.email || '',
        company: lead?.company || '',
        source: lead?.source || '',
        notes: lead?.notes || '',
        recurring_value: initialRecurring(lead),
        specific_value: lead?.specific_value ? String(lead.specific_value) : '',
        services: lead?.services || [],
        responsible_id: lead?.responsible_id || '',
        status: lead?.status || defaultStatus || 'lead_novo',
      })
    }
  }, [open, lead, defaultStatus])

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      try {
        const data = {
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          company: formData.company || null,
          source: formData.source || null,
          notes: formData.notes || null,
          recurring_value: Number(formData.recurring_value) || 0,
          specific_value: Number(formData.specific_value) || 0,
          services: formData.services,
          responsible_id: formData.responsible_id || null,
          status: formData.status,
        }

        if (lead) {
          await updateCRMLead(lead.id, data)
        } else {
          await createCRMLead(data)
        }

        setOpen(false)
        onSuccess?.()

        if (!lead) {
          setFormData({
            name: '',
            phone: '',
            email: '',
            company: '',
            source: '',
            notes: '',
            recurring_value: '',
            specific_value: '',
            services: [],
            responsible_id: '',
            status: defaultStatus || 'lead_novo',
          })
        }
      } catch (error) {
        console.error('[v0] Error saving lead:', error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-card border-border p-4 sm:p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {lead ? 'Editar Lead' : 'Novo Lead'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {lead
                ? 'Atualize as informações do lead.'
                : 'Preencha os dados do novo lead.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nome do lead"
                className="bg-secondary border-border"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company: e.target.value }))
                }
                placeholder="Nome da empresa"
                className="bg-secondary border-border"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="(00) 00000-0000"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="email@exemplo.com"
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="recurring_value">Valor recorrente (R$/mês)</Label>
                  <Input
                    id="recurring_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.recurring_value}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, recurring_value: e.target.value }))
                    }
                    placeholder="0,00"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="specific_value">Valor específico (R$ pontual)</Label>
                  <Input
                    id="specific_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.specific_value}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, specific_value: e.target.value }))
                    }
                    placeholder="0,00"
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Total da proposta:{' '}
                <span className="font-medium text-foreground">
                  R$ {((Number(formData.recurring_value) || 0) + (Number(formData.specific_value) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source">Origem</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, source: e.target.value }))
                }
                placeholder="Ex: Instagram, Indicação, Google..."
                className="bg-secondary border-border"
              />
            </div>

            <ResponsibleSelect
              value={formData.responsible_id}
              onChange={(id) => setFormData((prev) => ({ ...prev, responsible_id: id }))}
            />

            <div className="grid gap-2">
              <Label>Serviços desejados</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border border-border bg-secondary/40 p-3">
                {CRM_SERVICES.map((service) => (
                  <label
                    key={service}
                    htmlFor={`service-${service}`}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      id={`service-${service}`}
                      checked={formData.services.includes(service)}
                      onCheckedChange={() => toggleService(service)}
                    />
                    {service}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Anotações sobre o lead..."
                className="bg-secondary border-border min-h-[80px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value as CRMStatus }))
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CRM_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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

// Controlled version for external state management
export function CRMLeadFormDialogControlled({ 
  lead, 
  open, 
  onOpenChange, 
  onSuccess 
}: CRMLeadFormDialogControlledProps) {
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    source: '',
    notes: '',
    recurring_value: '',
    specific_value: '',
    services: [] as string[],
    responsible_id: '',
    status: 'lead_novo' as CRMStatus,
  })

  useEffect(() => {
    if (open && lead) {
      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        company: lead.company || '',
        source: lead.source || '',
        notes: lead.notes || '',
        recurring_value: initialRecurring(lead),
        specific_value: lead.specific_value ? String(lead.specific_value) : '',
        services: lead.services || [],
        responsible_id: lead.responsible_id || '',
        status: lead.status || 'lead_novo',
      })
    }
  }, [open, lead])

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      try {
        const data = {
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          company: formData.company || null,
          source: formData.source || null,
          notes: formData.notes || null,
          recurring_value: Number(formData.recurring_value) || 0,
          specific_value: Number(formData.specific_value) || 0,
          services: formData.services,
          responsible_id: formData.responsible_id || null,
          status: formData.status,
        }

        if (lead) {
          await updateCRMLead(lead.id, data)
        } else {
          await createCRMLead(data)
        }

        onOpenChange(false)
        onSuccess?.()
      } catch (error) {
        console.error('[v0] Error saving lead:', error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-card border-border p-4 sm:p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {lead ? 'Editar Lead' : 'Novo Lead'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {lead
                ? 'Atualize as informações do lead.'
                : 'Preencha os dados do novo lead.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="name-controlled">Nome *</Label>
              <Input
                id="name-controlled"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nome do lead"
                className="bg-secondary border-border"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company-controlled">Empresa</Label>
              <Input
                id="company-controlled"
                value={formData.company}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company: e.target.value }))
                }
                placeholder="Nome da empresa"
                className="bg-secondary border-border"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone-controlled">Telefone</Label>
                <Input
                  id="phone-controlled"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="(00) 00000-0000"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email-controlled">E-mail</Label>
                <Input
                  id="email-controlled"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="email@exemplo.com"
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="recurring_value-controlled">Valor recorrente (R$/mês)</Label>
                  <Input
                    id="recurring_value-controlled"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.recurring_value}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, recurring_value: e.target.value }))
                    }
                    placeholder="0,00"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="specific_value-controlled">Valor específico (R$ pontual)</Label>
                  <Input
                    id="specific_value-controlled"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.specific_value}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, specific_value: e.target.value }))
                    }
                    placeholder="0,00"
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Total da proposta:{' '}
                <span className="font-medium text-foreground">
                  R$ {((Number(formData.recurring_value) || 0) + (Number(formData.specific_value) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source-controlled">Origem</Label>
              <Input
                id="source-controlled"
                value={formData.source}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, source: e.target.value }))
                }
                placeholder="Ex: Instagram, Indicação, Google..."
                className="bg-secondary border-border"
              />
            </div>

            <ResponsibleSelect
              value={formData.responsible_id}
              onChange={(id) => setFormData((prev) => ({ ...prev, responsible_id: id }))}
            />

            <div className="grid gap-2">
              <Label>Serviços desejados</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border border-border bg-secondary/40 p-3">
                {CRM_SERVICES.map((service) => (
                  <label
                    key={service}
                    htmlFor={`service-controlled-${service}`}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      id={`service-controlled-${service}`}
                      checked={formData.services.includes(service)}
                      onCheckedChange={() => toggleService(service)}
                    />
                    {service}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes-controlled">Observações</Label>
              <Textarea
                id="notes-controlled"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Anotações sobre o lead..."
                className="bg-secondary border-border min-h-[80px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status-controlled">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value as CRMStatus }))
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CRM_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
