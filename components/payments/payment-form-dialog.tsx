'use client'

import React from "react"

import { useState, useEffect, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type Payment } from '@/lib/data/payments'
import { type Client } from '@/lib/data/clients'
import { createPaymentAction, updatePaymentAction, getClientsAction } from '@/app/cobrancas/actions'

interface PaymentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment?: Payment | null
  onSuccess: () => void
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  payment,
  onSuccess,
}: PaymentFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [clients, setClients] = useState<Client[]>([])
  const [isStandalone, setIsStandalone] = useState(!payment?.client_id)
  const [formData, setFormData] = useState({
    client_id: payment?.client_id || '',
    clientName: payment?.client_name || '',
    due_date: payment?.due_date || '',
    amount: payment?.amount?.toString() || '',
    payment_method: payment?.payment_method || '',
    notes: payment?.notes || '',
  })

  useEffect(() => {
    if (open) {
      loadClients()
      if (payment) {
        setIsStandalone(!payment.client_id)
        setFormData({
          client_id: payment.client_id || '',
          clientName: payment.client_name || '',
          due_date: payment.due_date,
          amount: payment.amount.toString(),
          payment_method: payment.payment_method || '',
          notes: payment.notes || '',
        })
      } else {
        setIsStandalone(false)
        setFormData({
          client_id: '',
          clientName: '',
          due_date: '',
          amount: '',
          payment_method: '',
          notes: '',
        })
      }
    }
  }, [open, payment])

  async function loadClients() {
    try {
      const clientsData = await getClientsAction({ status: 'Ativo' })
      setClients(clientsData)
    } catch (error) {
      console.error('[v0] Error loading clients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isStandalone) {
      if (!formData.clientName || !formData.due_date || !formData.amount) {
        alert('Por favor, preencha todos os campos obrigatórios')
        return
      }
    } else {
      if (!formData.client_id || !formData.due_date || !formData.amount) {
        alert('Por favor, preencha todos os campos obrigatórios')
        return
      }
    }

    startTransition(async () => {
      try {
        if (payment) {
          await updatePaymentAction(payment.id, {
            client_id: isStandalone ? null : formData.client_id,
            client_name: isStandalone ? formData.clientName : undefined,
            due_date: formData.due_date,
            amount: parseFloat(formData.amount),
            payment_method: formData.payment_method || null,
            notes: formData.notes || null,
          })
        } else {
          await createPaymentAction({
            client_id: isStandalone ? null : formData.client_id,
            client_name: isStandalone ? formData.clientName : undefined,
            due_date: formData.due_date,
            amount: parseFloat(formData.amount),
            payment_method: formData.payment_method,
            notes: formData.notes,
          })
        }
        onSuccess()
        onOpenChange(false)
      } catch (error) {
        console.error('[v0] Error saving payment:', error)
        alert('Erro ao salvar pagamento')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {payment ? 'Editar Pagamento' : 'Novo Pagamento'}
          </DialogTitle>
          <DialogDescription>
            {payment ? 'Atualize os dados do pagamento' : 'Crie um novo registro de pagamento'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Tab for selecting payment type */}
          {!payment && (
            <Tabs 
              value={isStandalone ? 'standalone' : 'client'} 
              onValueChange={(value) => {
                setIsStandalone(value === 'standalone')
                setFormData(prev => ({
                  ...prev,
                  client_id: '',
                  clientName: ''
                }))
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="client">Cliente Existente</TabsTrigger>
                <TabsTrigger value="standalone">Pagamento Avulso</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Client Selection */}
          {!isStandalone && (
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, client_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Standalone Client Name */}
          {isStandalone && (
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente *</Label>
              <Input
                id="clientName"
                type="text"
                placeholder="Ex: João Silva, empresa XYZ..."
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Este pagamento será registrado como avulso de Impulsionai Marketing
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="due_date">Data de Vencimento *</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pagamento</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) =>
                setFormData({ ...formData, payment_method: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pix">Pix</SelectItem>
                <SelectItem value="Boleto">Boleto</SelectItem>
                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                <SelectItem value="Transferência Bancária">
                  Transferência Bancária
                </SelectItem>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre este pagamento"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
