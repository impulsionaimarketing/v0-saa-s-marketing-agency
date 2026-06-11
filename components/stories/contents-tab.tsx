"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  Instagram,
  Video,
  Image as ImageIcon,
  Upload,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import type { StoryContent, UpdateStoryContentInput } from "@/lib/types/stories"

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

interface ContentsTabProps {
  contents: StoryContent[]
  loading: boolean
  onUpload: (file: File) => Promise<void>
  onUpdate: (id: string, input: UpdateStoryContentInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onOpenInstagram: () => void
}

export function ContentsTab({
  contents,
  loading,
  onUpload,
  onUpdate,
  onDelete,
  onOpenInstagram,
}: ContentsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState<StoryContent | null>(null)
  const [deleting, setDeleting] = useState<StoryContent | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        await onUpload(file)
      }
      toast.success("Conteúdo adicionado com sucesso.")
    } catch {
      toast.error("Erro ao adicionar conteúdo.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {contents.length} conteúdo(s) cadastrado(s)
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={onOpenInstagram}>
            <Instagram className="h-4 w-4" />
            Importar do Instagram
          </Button>
          <Button
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Adicionar Conteúdo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.mp4,image/jpeg,image/png,video/mp4"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
          ))}
        </div>
      ) : contents.length === 0 ? (
        <Card className="border-dashed bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Upload className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground">Nenhum conteúdo ainda</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Faça upload de imagens (jpg, png) ou vídeos (mp4), ou importe posts do Instagram.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {contents.map((content) => (
            <Card
              key={content.id}
              className={`group overflow-hidden bg-card transition-opacity ${
                content.is_active ? "" : "opacity-60"
              }`}
            >
              <div className="relative aspect-[4/5] bg-muted">
                {content.thumbnail_url || content.file_url ? (
                  <Image
                    src={content.thumbnail_url || content.file_url || "/placeholder.svg"}
                    alt={content.caption || "Conteúdo do story"}
                    fill
                    className="object-cover"
                    crossOrigin="anonymous"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute left-2 top-2 flex gap-1">
                  <Badge variant="secondary" className="gap-1 bg-background/85">
                    {content.type === "video" ? (
                      <Video className="h-3 w-3" />
                    ) : (
                      <ImageIcon className="h-3 w-3" />
                    )}
                    {content.type === "video" ? "Vídeo" : "Imagem"}
                  </Badge>
                </div>
                <div className="absolute right-2 top-2">
                  <Badge variant="secondary" className="gap-1 bg-background/85">
                    {content.source === "instagram" ? (
                      <>
                        <Instagram className="h-3 w-3" /> Instagram
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3" /> Upload
                      </>
                    )}
                  </Badge>
                </div>

                {!content.is_active && (
                  <div className="absolute inset-x-0 bottom-0 bg-background/85 py-1 text-center text-xs font-medium text-muted-foreground">
                    Inativo
                  </div>
                )}
              </div>

              <CardContent className="space-y-2 p-3">
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {formatDate(content.created_at)}
                </p>
                {content.caption && (
                  <p className="line-clamp-2 text-sm text-foreground">{content.caption}</p>
                )}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 gap-1 text-xs"
                    onClick={() => setEditing(content)}
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                    onClick={() => setDeleting(content)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <EditContentDialog
        content={editing}
        onClose={() => setEditing(null)}
        onSave={onUpdate}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conteúdo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O conteúdo será removido permanentemente da lista de
              stories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleting) return
                try {
                  await onDelete(deleting.id)
                  toast.success("Conteúdo excluído.")
                } catch {
                  toast.error("Erro ao excluir conteúdo.")
                } finally {
                  setDeleting(null)
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EditContentDialog({
  content,
  onClose,
  onSave,
}: {
  content: StoryContent | null
  onClose: () => void
  onSave: (id: string, input: UpdateStoryContentInput) => Promise<void>
}) {
  const [caption, setCaption] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  return (
    <Dialog open={!!content} onOpenChange={handleOpenChange}>
      <DialogContent
        onOpenAutoFocus={() => {
          setCaption(content?.caption || "")
          setIsActive(content?.is_active ?? true)
        }}
      >
        <DialogHeader>
          <DialogTitle>Editar conteúdo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="caption">Legenda</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Legenda opcional para o story"
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="active">Conteúdo ativo</Label>
              <p className="text-xs text-muted-foreground">
                Conteúdos inativos não entram na rotação de publicação.
              </p>
            </div>
            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            className="gap-2"
            disabled={saving}
            onClick={async () => {
              if (!content) return
              setSaving(true)
              try {
                await onSave(content.id, { caption, is_active: isActive })
                toast.success("Conteúdo atualizado.")
                onClose()
              } catch {
                toast.error("Erro ao atualizar conteúdo.")
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
