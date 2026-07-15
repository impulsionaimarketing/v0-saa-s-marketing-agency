"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Images,
  FolderOpen,
  Folder,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  CalendarClock,
} from "lucide-react"
import { toast } from "sonner"
import type { StoryFolder, StoryAutomation } from "@/lib/types/stories"
import {
  getFolderAutomationStatus,
  FOLDER_STATUS_LABELS,
  FOLDER_STATUS_DOT,
} from "@/lib/utils/schedule-display"

export type FolderFilter = "all" | "none" | string

interface FolderSidebarProps {
  folders: StoryFolder[]
  automations: StoryAutomation[]
  active: FolderFilter
  onSelect: (filter: FolderFilter) => void
  totalCount: number
  noFolderCount: number
  /** Mapa folderId -> nº de mídias ativas, usado para derivar o status. */
  activeCountByFolder: Map<string, number>
  onCreate: (name: string) => Promise<unknown>
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSchedule: (folder: StoryFolder) => void
}

export function FolderSidebar({
  folders,
  automations,
  active,
  onSelect,
  totalCount,
  noFolderCount,
  activeCountByFolder,
  onCreate,
  onRename,
  onDelete,
  onSchedule,
}: FolderSidebarProps) {
  // Mapa folderId -> automação, para exibir o indicador e o rótulo da ação.
  const automationByFolder = new Map<string, StoryAutomation>()
  for (const a of automations) {
    if (a.folder_id) automationByFolder.set(a.folder_id, a)
  }
  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState<StoryFolder | null>(null)
  const [deleting, setDeleting] = useState<StoryFolder | null>(null)

  return (
    <>
      <aside className="flex w-full shrink-0 flex-col rounded-xl border border-border bg-card lg:w-64">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h2 className="text-sm font-semibold text-foreground">Pastas</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCreating(true)}
            aria-label="Criar pasta"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="max-h-[520px]">
          <nav className="flex flex-col gap-0.5 p-2">
            <FolderItem
              icon={<Images className="h-4 w-4" />}
              label="Todas as mídias"
              count={totalCount}
              active={active === "all"}
              onClick={() => onSelect("all")}
            />
            <FolderItem
              icon={<FolderOpen className="h-4 w-4" />}
              label="Sem pasta"
              count={noFolderCount}
              active={active === "none"}
              onClick={() => onSelect("none")}
            />

            {folders.length > 0 && (
              <div className="my-1 border-t border-border" />
            )}

            {folders.map((folder) => {
              const automation = automationByFolder.get(folder.id)
              const scheduled = Boolean(automation)
              const status = getFolderAutomationStatus(
                automation,
                activeCountByFolder.get(folder.id) ?? 0,
              )
              return (
                <FolderItem
                  key={folder.id}
                  icon={<Folder className="h-4 w-4" />}
                  label={folder.name}
                  count={folder.content_count ?? 0}
                  active={active === folder.id}
                  onClick={() => onSelect(folder.id)}
                  indicator={
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${FOLDER_STATUS_DOT[status]}`}
                      title={FOLDER_STATUS_LABELS[status]}
                      aria-label={`Status: ${FOLDER_STATUS_LABELS[status]}`}
                    />
                  }
                  actions={
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Ações da pasta ${folder.name}`}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSchedule(folder)}>
                          <CalendarClock className="h-4 w-4" />
                          {scheduled ? "Editar programação" : "Programar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRenaming(folder)}>
                          <Pencil className="h-4 w-4" />
                          Renomear
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(folder)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  }
                />
              )
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Criar / Renomear */}
      <FolderNameDialog
        open={creating}
        title="Criar pasta"
        onClose={() => setCreating(false)}
        onConfirm={async (name) => {
          await onCreate(name)
          toast.success("Pasta criada.")
        }}
      />
      <FolderNameDialog
        open={!!renaming}
        title="Renomear pasta"
        initialValue={renaming?.name ?? ""}
        onClose={() => setRenaming(null)}
        onConfirm={async (name) => {
          if (!renaming) return
          await onRename(renaming.id, name)
          toast.success("Pasta renomeada.")
        }}
      />

      {/* Excluir */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pasta?</AlertDialogTitle>
            <AlertDialogDescription>
              As mídias dentro de &quot;{deleting?.name}&quot; não serão excluídas — elas voltam para
              &quot;Sem pasta&quot;.
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
                  toast.success("Pasta excluída.")
                  if (active === deleting.id) onSelect("all")
                } catch {
                  toast.error("Erro ao excluir pasta.")
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
    </>
  )
}

function FolderItem({
  icon,
  label,
  count,
  active,
  onClick,
  actions,
  indicator,
}: {
  icon: React.ReactNode
  label: string
  count: number
  active: boolean
  onClick: () => void
  actions?: React.ReactNode
  indicator?: React.ReactNode
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className={`group flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-foreground hover:bg-muted"
      }`}
    >
      <span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      <span className="line-clamp-1 flex-1">{label}</span>
      {indicator}
      {actions}
      <span
        className={`shrink-0 rounded-full px-1.5 text-xs ${
          active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </div>
  )
}

function FolderNameDialog({
  open,
  title,
  initialValue = "",
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  initialValue?: string
  onClose: () => void
  onConfirm: (name: string) => Promise<void>
}) {
  const [name, setName] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await onConfirm(trimmed)
      onClose()
    } catch {
      toast.error("Não foi possível salvar a pasta.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent onOpenAutoFocus={() => setName(initialValue)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="folder-name">Nome da pasta</Label>
          <Input
            id="folder-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Promoções, Institucional..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) submit()
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button className="gap-2" onClick={submit} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
