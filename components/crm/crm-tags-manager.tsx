'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, Loader2, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createTag, updateTag, deleteTag, type CRMTag } from '@/lib/data/crm'
import { DeleteDialog } from '@/components/shared/delete-dialog'

const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#78716c', '#64748b', '#71717a',
]

interface CRMTagsManagerProps {
  tags: CRMTag[]
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CRMTagsManager({
  tags,
  open,
  onClose,
  onSuccess,
}: CRMTagsManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<CRMTag | null>(null)
  const [deletingTag, setDeletingTag] = useState<CRMTag | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    color: TAG_COLORS[0],
  })

  const openDialog = (tag?: CRMTag) => {
    if (tag) {
      setEditingTag(tag)
      setFormData({ name: tag.name, color: tag.color })
    } else {
      setEditingTag(null)
      setFormData({ name: '', color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)] })
    }
    setDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        if (editingTag) {
          await updateTag(editingTag.id, formData)
        } else {
          await createTag(formData)
        }
        setDialogOpen(false)
        onSuccess()
      } catch (error) {
        console.error('[CRM] Error saving tag:', error)
      }
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTag) return
    startTransition(async () => {
      try {
        await deleteTag(deletingTag.id)
        setDeletingTag(null)
        onSuccess()
      } catch (error) {
        console.error('[CRM] Error deleting tag:', error)
      }
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-[400px] sm:max-w-[400px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Gerenciar Tags
            </SheetTitle>
            <SheetDescription>
              Crie e edite tags para categorizar seus leads.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <Button onClick={() => openDialog()} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Nova Tag
            </Button>

            <div className="space-y-2">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma tag criada ainda.
                </p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium text-sm">{tag.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openDialog(tag)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeletingTag(tag)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingTag ? 'Editar Tag' : 'Nova Tag'}
              </DialogTitle>
              <DialogDescription>
                {editingTag 
                  ? 'Atualize as informações da tag.' 
                  : 'Crie uma nova tag para categorizar leads.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="tag-name">Nome</Label>
                <Input
                  id="tag-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Quente, Alto Ticket..."
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        'w-6 h-6 rounded-full transition-all',
                        formData.color === color && 'ring-2 ring-offset-2 ring-primary'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingTag ? 'Salvar' : 'Criar Tag'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteDialog
        open={!!deletingTag}
        onOpenChange={(open) => !open && setDeletingTag(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Tag"
        description={`Tem certeza que deseja excluir a tag "${deletingTag?.name}"? Esta ação não pode ser desfeita.`}
      />
    </>
  )
}
