'use client'

import React from "react"

import { useState, useEffect, useTransition } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { createProduction } from '@/lib/data/productions'
import { PRODUCTION_STATUSES } from '@/lib/constants'
import { getClients, type Client } from '@/lib/data/clients'
import { getUsers, type User } from '@/lib/data/users'

interface ProductionFormDialogProps {
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function ProductionFormDialog({
  onSuccess,
  trigger,
}: ProductionFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])

  const [formData, setFormData] = useState({
    client_id: '',
    type: 'Vídeo' as 'Vídeo' | 'Arte',
    responsible_id: '',
    status: 'Planejamento',
    post_date: '',
    notes: '',
  })

  useEffect(() => {
    if (open) {
      Promise.all([getClients(), getUsers()]).then(([clientsData, usersData]) => {
        setClients(clientsData)
        setUsers(usersData)
      })
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      try {
        await createProduction({
          client_id: formData.client_id,
          type: formData.type,
          responsible_id: formData.responsible_id || undefined,
          status: formData.status,
          post_date: formData.post_date || undefined,
          notes: formData.notes || undefined,
        })

        setOpen(false)
        setFormData({
          client_id: '',
          type: 'Vídeo',
          responsible_id: '',
          status: 'Planejamento',
          post_date: '',
          notes: '',
        })
        onSuccess?.()
      } catch (error) {
        console.error('Error creating production:', error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Criativo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo Criativo</DialogTitle>
            <DialogDescription>
              Adicione um novo criativo ao pipeline de produção.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client_id">Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, client_id: value })
                }
                required
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

            <div className="grid gap-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as 'Vídeo' | 'Arte' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vídeo">Vídeo</SelectItem>
                  <SelectItem value="Arte">Arte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="responsible_id">Responsável</Label>
              <Select
                value={formData.responsible_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, responsible_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não atribuído</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status Inicial</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="post_date">Data de Publicação</Label>
              <Input
                id="post_date"
                type="date"
                value={formData.post_date}
                onChange={(e) =>
                  setFormData({ ...formData, post_date: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Observações sobre o criativo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !formData.client_id}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Criativo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
