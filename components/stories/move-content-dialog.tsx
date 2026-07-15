"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FolderOpen, Folder, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { StoryFolder } from "@/lib/types/stories"

interface MoveContentDialogProps {
  open: boolean
  count: number
  folders: StoryFolder[]
  onClose: () => void
  onMove: (folderId: string | null) => Promise<void>
}

export function MoveContentDialog({
  open,
  count,
  folders,
  onClose,
  onMove,
}: MoveContentDialogProps) {
  const [target, setTarget] = useState<string | null>(null)
  const [moving, setMoving] = useState(false)

  const handleMove = async () => {
    setMoving(true)
    try {
      await onMove(target)
      toast.success(count > 1 ? "Mídias movidas." : "Mídia movida.")
      onClose()
    } catch {
      toast.error("Erro ao mover.")
    } finally {
      setMoving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent onOpenAutoFocus={() => setTarget(null)}>
        <DialogHeader>
          <DialogTitle>Mover {count > 1 ? `${count} mídias` : "mídia"}</DialogTitle>
          <DialogDescription>Escolha a pasta de destino.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-72 -mx-1 px-1">
          <div className="flex flex-col gap-1 py-1">
            <FolderOption
              icon={<FolderOpen className="h-4 w-4" />}
              label="Sem pasta"
              selected={target === null}
              onClick={() => setTarget(null)}
            />
            {folders.map((folder) => (
              <FolderOption
                key={folder.id}
                icon={<Folder className="h-4 w-4" />}
                label={folder.name}
                count={folder.content_count ?? 0}
                selected={target === folder.id}
                onClick={() => setTarget(folder.id)}
              />
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={moving}>
            Cancelar
          </Button>
          <Button className="gap-2" onClick={handleMove} disabled={moving}>
            {moving && <Loader2 className="h-4 w-4 animate-spin" />}
            Mover para cá
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FolderOption({
  icon,
  label,
  count,
  selected,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  count?: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-foreground hover:bg-muted"
      }`}
    >
      <span className={selected ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      <span className="line-clamp-1 flex-1">{label}</span>
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
      {selected && <Check className="h-4 w-4" />}
    </button>
  )
}
