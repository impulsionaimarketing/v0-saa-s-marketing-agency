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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import {
  createCRMLead,
  updateCRMLead,
  type CRMLead,
  type CRMStatus,
  CRM_STATUS_CONFIG,
} from '@/lib/data/crm-leads'

interface CRMLeadFormDialogProps {
  lead?: CRMLead | null
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function CRMLeadFormDialog({ lead, onSuccess, trigger }: CRMLeadFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    status: 'lead_novo' as CRMStatus,
  })

  useEffect(() => {
    if (open) {
      setFormData({
        name: lead?.name || '',
        phone: lead?.phone || '',
        email: lead?.email || '',
        company: lead?.company || '',
        status: lead?.status || 'lead_novo',
      })
    }
  }, [open, lead])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      try {
        const data = {
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          company: formData.company || null,
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
            status: 'lead_novo',
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
