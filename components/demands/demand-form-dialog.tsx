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
import { createDemand, updateDemand, type Demand } from '@/lib/data/demands'
import { getClients, type Client } from '@/lib/data/clients'
import { getUsers, type User } from '@/lib/data/users'

interface DemandFormDialogProps {
  demand?: Demand | null
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function DemandFormDialog({ demand, onSuccess, trigger }: DemandFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  
  const [formData, setFormData] = useState({
    name: demand?.name || '',
    description: demand?.description || '',
    client_id: demand?.client_id || '',
    area: demand?.area || 'Arte',
    responsible_id: demand?.responsible_id || '',
    deadline: demand?.deadline?.split('T')[0] || '',
    status: demand?.status || 'A Fazer',
    priority: demand?.priority || 'medium',
  })

  useEffect(() => {
    if (open) {
      loadOptions()
    }
  }, [open])

  async function loadOptions() {
    try {
      const [clientsData, usersData] = await Promise.all([
        getClients({ status: 'Ativo' }),
        getUsers({ status: 'Ativo' }),
      ])
      setClients(clientsData)
      setUsers(usersData)
    } catch (error) {
      console.error('[v0] Error loading options:', error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        const data = {
          name: formData.name,
          description: formData.description || null,
          client_id: formData.client_id,
          area: formData.area as Demand['area'],
          responsible_id: formData.responsible_id || null,
          deadline: formData.deadline || null,
          status: formData.status as Demand['status'],
          priority: formData.priority as Demand['priority'],
        }

        if (demand) {
          await updateDemand(demand.id, data)
        } else {
          await createDemand(data)
        }

        setOpen(false)
        onSuccess?.()
        
        if (!demand) {
          setFormData({
            name: '',
            description: '',
            client_id: '',
            area: 'Arte',
            responsible_id: '',
            deadline: '',
            status: 'A Fazer',
            priority: 'medium',
          })
        }
      } catch (error) {
        console.error('[v0] Error saving demand:', error)
      }
    })
  }

  const filteredUsers = users.filter(u => u.area === formData.area || !u.area)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Demanda
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{demand ? 'Editar Demanda' : 'Nova Demanda'}</DialogTitle>
            <DialogDescription>
              {demand ? 'Atualize as informações da demanda.' : 'Preencha os dados da nova demanda.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Título da Demanda</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Criar post para Instagram"
                className="bg-secondary border-border"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes da demanda..."
                className="bg-secondary border-border resize-none"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client_id">Cliente</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
              >
                <SelectTrigger className="bg-secondary border-border">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="area">Área</Label>
                <Select
                  value={formData.area}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, area: value, responsible_id: '' }))}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arte">Arte</SelectItem>
                    <SelectItem value="Vídeo">Vídeo</SelectItem>
                    <SelectItem value="Tráfego">Tráfego</SelectItem>
                    <SelectItem value="Comunicação">Comunicação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="responsible_id">Responsável</Label>
                <Select
                  value={formData.responsible_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, responsible_id: value }))}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não atribuído</SelectItem>
                    {filteredUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="deadline">Prazo</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="bg-secondary border-border"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {demand && (
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A Fazer">A Fazer</SelectItem>
                    <SelectItem value="Em Produção">Em Produção</SelectItem>
                    <SelectItem value="Em Revisão">Em Revisão</SelectItem>
                    <SelectItem value="Aprovado">Aprovado</SelectItem>
                    <SelectItem value="Publicado">Publicado</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !formData.client_id}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {demand ? 'Salvar' : 'Criar Demanda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
