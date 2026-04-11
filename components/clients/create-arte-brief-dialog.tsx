'use client'

import { useState, useEffect } from 'react'
import { type User } from '@/lib/data/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

interface CreateArteBriefDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: any) => Promise<void>
  users: User[]
}

export function CreateArteBriefDialog({
  isOpen,
  onClose,
  onCreate,
  users,
}: CreateArteBriefDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    format: '',
    reference_links: '',
    description: '',
    colors: '',
    elements: '',
    responsible_id: '',
    deadline: '',
  })
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    try {
      await onCreate(formData)
      setFormData({
        name: '',
        format: '',
        reference_links: '',
        description: '',
        colors: '',
        elements: '',
        responsible_id: '',
        deadline: '',
      })
      onClose()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Briefing de Arte</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Arte *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="format">Formato</Label>
            <Input
              id="format"
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              placeholder="Ex: Feed 1:1, Stories 9:16, Banner"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="reference_links">Links de Referência</Label>
            <Textarea
              id="reference_links"
              value={formData.reference_links}
              onChange={(e) => setFormData({ ...formData, reference_links: e.target.value })}
              placeholder="Cole os links de referência aqui"
              rows={3}
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição/Briefing</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o que deve conter na arte"
              rows={5}
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="colors">Cores</Label>
            <Input
              id="colors"
              value={formData.colors}
              onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
              placeholder="Ex: Azul, Verde, Branco"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="elements">Elementos</Label>
            <Input
              id="elements"
              value={formData.elements}
              onChange={(e) => setFormData({ ...formData, elements: e.target.value })}
              placeholder="Ex: Logo, Foto do produto, CTA"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="responsible_id">Responsável</Label>
            <Select
              value={formData.responsible_id}
              onValueChange={(value) => setFormData({ ...formData, responsible_id: value })}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar responsável" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="deadline">Prazo</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              disabled={isPending}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? 'Criando...' : 'Criar Briefing'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
