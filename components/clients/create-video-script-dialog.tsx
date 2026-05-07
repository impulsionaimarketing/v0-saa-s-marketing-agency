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

interface CreateVideoScriptDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: any) => Promise<void>
  users: User[]
}

export function CreateVideoScriptDialog({
  isOpen,
  onClose,
  onCreate,
  users,
}: CreateVideoScriptDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    format: '',
    reference_links: '',
    script_text: '',
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
        script_text: '',
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
          <DialogTitle>Novo Roteiro de Vídeo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Vídeo *</Label>
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
              placeholder="Ex: Reels, Stories, Feed, YouTube"
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
            <Label htmlFor="script_text">Roteiro/Texto</Label>
            <Textarea
              id="script_text"
              value={formData.script_text}
              onChange={(e) => setFormData({ ...formData, script_text: e.target.value })}
              placeholder="Escreva o roteiro do vídeo aqui"
              rows={8}
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
              {isPending ? 'Criando...' : 'Criar Roteiro'}
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
