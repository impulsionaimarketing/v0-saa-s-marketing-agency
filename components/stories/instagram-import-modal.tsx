"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Instagram, Video, Loader2 } from "lucide-react"
import { useInstagramPosts } from "@/lib/hooks/use-stories"
import type { InstagramMedia } from "@/lib/types/stories"
import { toast } from "sonner"

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

export function InstagramImportModal({
  companyId,
  open,
  onClose,
  onImport,
}: {
  companyId: string | null
  open: boolean
  onClose: () => void
  onImport: (media: InstagramMedia[]) => Promise<void>
}) {
  const { media, connected, loading, fetchPosts } = useInstagramPosts(companyId)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    if (open && companyId) {
      setSelected(new Set())
      fetchPosts()
    }
  }, [open, companyId, fetchPosts])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleImport = async () => {
    const toImport = media.filter((m) => selected.has(m.id))
    if (toImport.length === 0) return
    setImporting(true)
    try {
      await onImport(toImport)
      toast.success(`${toImport.length} post(s) importado(s) com sucesso.`)
      onClose()
    } catch {
      toast.error("Erro ao importar posts.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            Importar do Instagram
          </DialogTitle>
          <DialogDescription>
            Selecione os posts já publicados no Instagram conectado para reutilizá-los nos stories.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[300px]">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : !connected ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Instagram className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium text-foreground">Instagram não conectado</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Conecte uma conta do Instagram a esta empresa para importar posts publicados.
                A integração com a Graph API será habilitada em breve.
              </p>
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum post encontrado no Instagram conectado.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[360px] pr-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {media.map((post) => {
                  const isSelected = selected.has(post.id)
                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => toggle(post.id)}
                      className={`group relative overflow-hidden rounded-lg border-2 text-left transition-colors ${
                        isSelected ? "border-primary" : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div className="relative aspect-square bg-muted">
                        <Image
                          src={post.thumbnail_url || post.media_url || "/placeholder.svg"}
                          alt={post.caption || "Post do Instagram"}
                          fill
                          className="object-cover"
                          crossOrigin="anonymous"
                          unoptimized
                        />
                        {post.media_type === "VIDEO" && (
                          <span className="absolute right-2 top-2 rounded-full bg-background/80 p-1">
                            <Video className="h-3.5 w-3.5 text-foreground" />
                          </span>
                        )}
                        <span className="absolute left-2 top-2">
                          <Checkbox checked={isSelected} className="bg-background" />
                        </span>
                      </div>
                      <div className="p-2">
                        <p className="truncate text-xs text-muted-foreground">
                          {formatDate(post.timestamp)}
                        </p>
                        <p className="line-clamp-1 text-xs text-foreground">
                          {post.caption || "Sem legenda"}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={importing}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={selected.size === 0 || importing} className="gap-2">
            {importing && <Loader2 className="h-4 w-4 animate-spin" />}
            Importar {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
