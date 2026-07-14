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
import { Plus, Loader2, Upload, X, Video, Image as ImageIcon } from 'lucide-react'
import { createProduction, updateProduction, type Production } from '@/lib/data/productions'
import { PRODUCTION_STATUSES } from '@/lib/constants'
import { getClients, type Client } from '@/lib/data/clients'
import { getUsers, type User } from '@/lib/data/users'
import { toast } from 'sonner'

interface ProductionFormDialogProps {
  onSuccess?: () => void
  trigger?: React.ReactNode
  /** When provided, the dialog operates in edit mode and pre-loads this production. */
  production?: Production | null
  /** Controlled open state (optional). */
  open?: boolean
  /** Controlled open change handler (optional). */
  onOpenChange?: (open: boolean) => void
}

const EMPTY_FORM = {
  title: '',
  client_id: '',
  type: 'Vídeo' as 'Vídeo' | 'Arte',
  responsible_id: '',
  status: 'Planejamento',
  post_date: '',
  caption: '',
  notes: '',
}

export function ProductionFormDialog({
  onSuccess,
  trigger,
  production,
  open: controlledOpen,
  onOpenChange,
}: ProductionFormDialogProps) {
  const isEditMode = Boolean(production)

  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (value: boolean) => {
    if (onOpenChange) onOpenChange(value)
    if (controlledOpen === undefined) setInternalOpen(value)
  }

  const [isPending, startTransition] = useTransition()
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const [formData, setFormData] = useState({ ...EMPTY_FORM })

  useEffect(() => {
    if (open) {
      Promise.all([getClients(), getUsers()]).then(([clientsData, usersData]) => {
        setClients(clientsData)
        setUsers(usersData)
      })
    }
  }, [open])

  // Pre-load form data when editing (or reset when creating)
  useEffect(() => {
    if (open) {
      if (production) {
        setFormData({
          title: production.title || production.notes || '',
          client_id: production.client_id || '',
          type: production.type || 'Vídeo',
          responsible_id: production.responsible_id || 'none',
          status: production.status || 'Planejamento',
          post_date: production.post_date ? production.post_date.split('T')[0] : '',
          caption: production.caption || '',
          notes: production.notes || '',
        })
      } else {
        setFormData({ ...EMPTY_FORM })
      }
      setSelectedFiles([])
    }
  }, [open, production])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) {
        toast.error(`"${file.name}" não é uma imagem ou vídeo`)
        return false
      }
      if (file.size > 5 * 1024 * 1024 * 1024) {
        toast.error(`"${file.name}" é muito grande (máx. 5GB)`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles])
    }
    // Permite selecionar o(s) mesmo(s) arquivo(s) novamente
    e.target.value = ''
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (productionId: string) => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    let successCount = 0
    try {
      const { uploadFile } = await import('@/lib/upload-client')

      for (const file of selectedFiles) {
        try {
          const blob = await uploadFile(file, `/api/upload-video/token?productionId=${productionId}`)

          const confirmRes = await fetch('/api/upload-video/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productionId: productionId,
              url: blob.url,
              filename: file.name,
              fileSize: file.size,
              fileType: file.type,
            }),
          })

          if (!confirmRes.ok) throw new Error('Erro ao salvar referência do arquivo')
          successCount++
        } catch (error) {
          console.error('[v0] Upload error:', error)
        }
      }

      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? 'Arquivo enviado com sucesso!'
            : `${successCount} arquivos enviados com sucesso!`
        )
      }
      if (successCount < selectedFiles.length) {
        const failed = selectedFiles.length - successCount
        toast.error(failed === 1 ? 'Erro ao enviar 1 arquivo' : `Erro ao enviar ${failed} arquivos`)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      try {
        const responsibleId =
          formData.responsible_id && formData.responsible_id !== 'none'
            ? formData.responsible_id
            : undefined

        if (isEditMode && production) {
          // Update existing production
          await updateProduction(production.id, {
            title: formData.title || undefined,
            client_id: formData.client_id,
            type: formData.type,
            responsible_id: responsibleId,
            status: formData.status,
            post_date: formData.post_date || undefined,
            caption: formData.caption || undefined,
            notes: formData.notes || undefined,
          })

          // Upload new files if any were selected
          if (selectedFiles.length > 0) {
            await uploadFiles(production.id)
          }

          toast.success('Criativo atualizado com sucesso!')
        } else {
          // Create new production
          const created = await createProduction({
            client_id: formData.client_id,
            type: formData.type,
            responsible_id: responsibleId,
            status: formData.status,
            post_date: formData.post_date || undefined,
            notes: formData.notes || undefined,
          })

          // Upload files if selected
          if (selectedFiles.length > 0 && created?.id) {
            await uploadFiles(created.id)
          }
        }

        setOpen(false)
        setFormData({ ...EMPTY_FORM })
        setSelectedFiles([])
        onSuccess?.()
      } catch (error) {
        console.error('Error saving production:', error)
        toast.error(isEditMode ? 'Erro ao atualizar criativo' : 'Erro ao criar criativo')
      }
    })
  }

  const existingFiles = production?.files ?? []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditMode && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Criativo
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="w-[95vw] sm:max-w-[500px] bg-card border-border p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {isEditMode ? 'Editar Criativo' : 'Novo Criativo'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {isEditMode
                ? 'Edite as informações do criativo e adicione novas mídias se necessário.'
                : 'Adicione um novo criativo ao pipeline de produção.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ex: Black Friday Temi Eletro"
              />
            </div>

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
              <Label htmlFor="status">{isEditMode ? 'Status' : 'Status Inicial'}</Label>
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
              <Label htmlFor="caption">Legenda</Label>
              <Textarea
                id="caption"
                value={formData.caption}
                onChange={(e) =>
                  setFormData({ ...formData, caption: e.target.value })
                }
                placeholder="Escreva a legenda da publicação..."
                rows={4}
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

            {/* Existing files (edit mode) */}
            {isEditMode && existingFiles.length > 0 && (
              <div className="grid gap-2">
                <Label>Mídias atuais ({existingFiles.length})</Label>
                <div className="space-y-2">
                  {existingFiles.map((file) => {
                    const isVideoFile = file.file_type?.startsWith('video/')
                    return (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-secondary/30 text-sm hover:bg-secondary/50 transition-colors"
                      >
                        {isVideoFile ? (
                          <Video className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                        )}
                        <span className="truncate">{file.filename}</span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="file-upload">
                {isEditMode
                  ? `Adicionar novas mídias (Opcional)${selectedFiles.length > 0 ? ` — ${selectedFiles.length} selecionada(s)` : ''}`
                  : `Arquivos (Opcional)${selectedFiles.length > 0 ? ` — ${selectedFiles.length} selecionado(s)` : ''}`}
              </Label>
              <div className="space-y-2">
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => {
                      const isVideoFile = file.type.startsWith('video/')
                      return (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isVideoFile ? (
                              <Video className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                            )}
                            <span className="text-sm truncate">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFile(index)}
                            className="shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}

                <input
                  type="file"
                  id="file-upload"
                  accept="image/*,video/*"
                  multiple
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
                      {selectedFiles.length > 0 ? 'Adicionar mais arquivos' : 'Selecionar Arquivos'}
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground">
                  Você pode selecionar várias imagens ou vídeos (até 5GB cada)
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
              {isUploading
                ? 'Enviando arquivo...'
                : isEditMode
                  ? 'Salvar Alterações'
                  : 'Criar Criativo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
