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
import { Plus, Loader2, Upload, X } from 'lucide-react'
import { createProduction } from '@/lib/data/productions'
import { PRODUCTION_STATUSES } from '@/lib/constants'
import { getClients, type Client } from '@/lib/data/clients'
import { getUsers, type User } from '@/lib/data/users'
import { toast } from 'sonner'

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    
    if (!isImage && !isVideo) {
      toast.error('Por favor, selecione uma imagem ou vídeo')
      return
    }

    // Validate file size (max 5GB)
    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Tamanho máximo: 5GB')
      return
    }

    setSelectedFile(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  const uploadFile = async (productionId: string) => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)
      uploadFormData.append('productionId', productionId)

      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        throw new Error('Falha no upload')
      }

      toast.success('Arquivo enviado com sucesso!')
    } catch (error) {
      console.error('[v0] Upload error:', error)
      toast.error('Erro ao enviar arquivo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      try {
        const production = await createProduction({
          client_id: formData.client_id,
          type: formData.type,
          responsible_id: formData.responsible_id || undefined,
          status: formData.status,
          post_date: formData.post_date || undefined,
          notes: formData.notes || undefined,
        })

        // Upload file if selected
        if (selectedFile && production?.id) {
          await uploadFile(production.id)
        }

        setOpen(false)
        setFormData({
          client_id: '',
          type: 'Vídeo',
          responsible_id: '',
          status: 'Planejamento',
          post_date: '',
          notes: '',
        })
        setSelectedFile(null)
        onSuccess?.()
      } catch (error) {
        console.error('Error creating production:', error)
        toast.error('Erro ao criar criativo')
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
      <DialogContent className="w-[95vw] sm:max-w-[500px] bg-card border-border p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Novo Criativo</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Adicione um novo criativo ao pipeline de produção.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-4">
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

            <div className="grid gap-2">
              <Label htmlFor="file">Arquivo (Opcional)</Label>
              <div className="space-y-2">
                {selectedFile ? (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Upload className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm truncate">{selectedFile.name}</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleRemoveFile}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="file-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full cursor-pointer"
                        asChild
                      >
                        <span className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Selecionar Arquivo
                        </span>
                      </Button>
                    </label>
                  </>
                )}
                <p className="text-xs text-muted-foreground">
                  Imagens ou vídeos até 5GB
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || isUploading || !formData.client_id} className="w-full sm:w-auto">
              {(isPending || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? 'Enviando arquivo...' : 'Criar Criativo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
