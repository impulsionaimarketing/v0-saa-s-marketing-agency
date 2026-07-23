"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Plus,
  Instagram,
  Upload,
  Loader2,
  Search,
  Building2,
  Folder,
  ArrowDownUp,
  CalendarClock,
  FolderInput,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  STORY_PUBLISH_MODE_LABELS,
  type StoryContent,
  type StoryFolder,
  type StoryAutomation,
  type UpdateStoryContentInput,
  type ScheduleConfigInput,
} from "@/lib/types/stories"
import {
  getFolderAutomationStatus,
  formatNextPublicationBR,
  formatAutomationFrequency,
  formatTimeBR,
  FOLDER_STATUS_LABELS,
  FOLDER_STATUS_DOT,
  FOLDER_STATUS_TEXT,
} from "@/lib/utils/schedule-display"
import type { InstagramAccount } from "@/lib/data/clients"
import { ContentCard } from "@/components/stories/content-card"
import { FolderSidebar, type FolderFilter } from "@/components/stories/folder-sidebar"
import { MoveContentDialog } from "@/components/stories/move-content-dialog"
import { ScheduleContentDialog } from "@/components/stories/schedule-content-dialog"
import {
  ScheduleFolderDialog,
  type FolderAutomationConfig,
} from "@/components/stories/schedule-folder-dialog"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { SortableContentCard } from "@/components/stories/sortable-content-card"

type SortOption = "manual" | "name" | "recent" | "oldest"

interface Company {
  id: string
  name: string
  instagram_accounts?: InstagramAccount[] | null
}

interface ContentsTabProps {
  contents: StoryContent[]
  folders: StoryFolder[]
  automations: StoryAutomation[]
  loading: boolean
  companies: Company[]
  companyId: string | null
  onCompanyChange: (id: string) => void
  onUpload: (file: File, folderId?: string | null) => Promise<void>
  onUpdate: (id: string, input: UpdateStoryContentInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDeleteMany: (ids: string[]) => Promise<void>
  onMove: (ids: string[], folderId: string | null) => Promise<void>
  onReorder: (items: { id: string; position: number }[]) => Promise<void>
  onSchedule: (contentIds: string[], config: ScheduleConfigInput) => Promise<void>
  onCreateFolder: (name: string) => Promise<unknown>
  onRenameFolder: (id: string, name: string) => Promise<void>
  onDeleteFolder: (id: string, moveTo?: string | null) => Promise<void>
  onSaveFolderAutomation: (folderId: string, config: FolderAutomationConfig) => Promise<unknown>
  onRemoveFolderAutomation: (folderId: string) => Promise<unknown>
  onOpenInstagram: () => void
}

export function ContentsTab({
  contents,
  folders,
  automations,
  loading,
  companies,
  companyId,
  onCompanyChange,
  onUpload,
  onUpdate,
  onDelete,
  onDeleteMany,
  onMove,
  onReorder,
  onSchedule,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onSaveFolderAutomation,
  onRemoveFolderAutomation,
  onOpenInstagram,
}: ContentsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // filtros / navegação
  const [activeFolder, setActiveFolder] = useState<FolderFilter>("all")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("manual")

  // seleção
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // dialogs
  const [editing, setEditing] = useState<StoryContent | null>(null)
  const [deletingOne, setDeletingOne] = useState<StoryContent | null>(null)
  const [deletingMany, setDeletingMany] = useState(false)
  const [moveIds, setMoveIds] = useState<string[] | null>(null)
  const [scheduleIds, setScheduleIds] = useState<string[] | null>(null)
  const [schedulingFolder, setSchedulingFolder] = useState<StoryFolder | null>(null)

  const noFolderCount = useMemo(
    () => contents.filter((c) => !c.folder_id).length,
    [contents],
  )

  // Contas de Instagram do cliente selecionado (para escolher na programação).
  const currentInstagramAccounts = useMemo<InstagramAccount[]>(() => {
    const company = companies.find((c) => c.id === companyId)
    return company?.instagram_accounts ?? []
  }, [companies, companyId])

  // Nº de mídias ativas por pasta, usado para derivar o status da automação.
  const activeCountByFolder = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of contents) {
      if (c.folder_id && c.is_active) {
        map.set(c.folder_id, (map.get(c.folder_id) ?? 0) + 1)
      }
    }
    return map
  }, [contents])

  // Mapa folderId -> automação, para banner de status e o diálogo.
  const automationByFolder = useMemo(() => {
    const map = new Map<string, StoryAutomation>()
    for (const a of automations) {
      if (a.folder_id) map.set(a.folder_id, a)
    }
    return map
  }, [automations])

  // Automação da pasta atualmente selecionada (se houver).
  const currentFolder =
    activeFolder !== "all" && activeFolder !== "none"
      ? folders.find((f) => f.id === activeFolder) ?? null
      : null
  const currentAutomation = currentFolder ? automationByFolder.get(currentFolder.id) ?? null : null

  const filtered = useMemo(() => {
    let list = contents
    if (activeFolder === "none") list = list.filter((c) => !c.folder_id)
    else if (activeFolder !== "all") list = list.filter((c) => c.folder_id === activeFolder)

    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((c) =>
        [c.name, c.caption, c.folder_name].some((v) => v?.toLowerCase().includes(q)),
      )
    }

    const sorted = [...list]
    sorted.sort((a, b) => {
      // Ordem manual (Drag & Drop): sempre por position ASC. Nunca created_at.
      if (sort === "manual") {
        if (a.position !== b.position) return a.position - b.position
        // desempate estável por created_at (mais antigas primeiro)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (sort === "name") return (a.name || "").localeCompare(b.name || "")
      const da = new Date(a.created_at).getTime()
      const db = new Date(b.created_at).getTime()
      return sort === "recent" ? db - da : da - db
    })
    return sorted
  }, [contents, activeFolder, search, sort])

  // Drag & Drop só é permitido na "Ordem manual" e sem busca ativa
  // (com filtro de texto a lista não representa a ordem real de publicação).
  const canReorder = sort === "manual" && search.trim().length === 0

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = filtered.findIndex((c) => c.id === active.id)
    const newIndex = filtered.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    // Nova ordem apenas do subconjunto visível (pasta/filtro atual).
    const reordered = arrayMove(filtered, oldIndex, newIndex)
    const items = reordered.map((c, index) => ({ id: c.id, position: index + 1 }))

    try {
      await onReorder(items)
      toast.success("Ordem atualizada com sucesso.")
    } catch (error) {
      console.error("[v0] Error reordering contents:", error)
      toast.error("Erro ao atualizar a ordem.")
    }
  }

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id))
  const someSelected = selected.size > 0

  // Agendamento individual só é permitido para mídias "Sem pasta".
  const selectionAllFolderless =
    someSelected && contents.filter((c) => selected.has(c.id)).every((c) => !c.folder_id)

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (filtered.every((c) => prev.has(c.id))) {
        const next = new Set(prev)
        filtered.forEach((c) => next.delete(c.id))
        return next
      }
      const next = new Set(prev)
      filtered.forEach((c) => next.add(c.id))
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? [])
    if (selectedFiles.length === 0) return

    // Mesma validação da aba Produção: aceita qualquer imagem/vídeo até 5GB.
    const validFiles = selectedFiles.filter((file) => {
      const isValidType = file.type.startsWith("image/") || file.type.startsWith("video/")
      if (!isValidType) {
        toast.error(`"${file.name}" não é uma imagem ou vídeo`)
        return false
      }
      if (file.size > 5 * 1024 * 1024 * 1024) {
        toast.error(`"${file.name}" é muito grande (máx. 5GB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setUploading(true)
    const folderId = activeFolder !== "all" && activeFolder !== "none" ? activeFolder : null
    let successCount = 0
    let errorCount = 0

    try {
      for (const file of validFiles) {
        try {
          await onUpload(file, folderId)
          successCount++
        } catch (error) {
          console.error("[v0] Stories upload error:", error)
          errorCount++
        }
      }
      if (successCount > 0) {
        toast.success(
          successCount === 1 ? "Conteúdo adicionado!" : `${successCount} arquivos adicionados!`,
        )
      }
      if (errorCount > 0) {
        toast.error(`Erro ao enviar ${errorCount} arquivo${errorCount > 1 ? "s" : ""}`)
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Sidebar de pastas */}
        <FolderSidebar
          folders={folders}
          automations={automations}
          active={activeFolder}
          onSelect={(f) => {
            setActiveFolder(f)
            clearSelection()
          }}
          totalCount={contents.length}
          noFolderCount={noFolderCount}
          activeCountByFolder={activeCountByFolder}
          onCreate={onCreateFolder}
          onRename={onRenameFolder}
          onDelete={onDeleteFolder}
          onSchedule={(folder) => setSchedulingFolder(folder)}
        />

        {/* Conteúdo principal */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Painel de informações da pasta selecionada */}
          {currentFolder && (
            <FolderInfoPanel
              folder={currentFolder}
              automation={currentAutomation}
              activeCount={activeCountByFolder.get(currentFolder.id) ?? 0}
              onSchedule={() => setSchedulingFolder(currentFolder)}
            />
          )}

          {/* Toolbar */}
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar mídias..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro por empresa */}
              <Select value={companyId ?? undefined} onValueChange={onCompanyChange}>
                <SelectTrigger className="w-full gap-2 sm:w-44">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro por pasta */}
              <Select
                value={activeFolder}
                onValueChange={(v) => {
                  setActiveFolder(v as FolderFilter)
                  clearSelection()
                }}
              >
                <SelectTrigger className="w-full gap-2 sm:w-40">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Pasta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as pastas</SelectItem>
                  <SelectItem value="none">Sem pasta</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Ordenação */}
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="w-full gap-2 sm:w-40">
                  <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Ordem manual</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigas</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="gap-2" onClick={onOpenInstagram}>
                <Instagram className="h-4 w-4" />
                <span className="hidden sm:inline">Instagram</span>
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
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Barra de seleção */}
          {someSelected && (
            <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 p-3 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={clearSelection}
                aria-label="Limpar seleção"
              >
                <X className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-foreground">
                {selected.size} selecionada(s)
              </span>
              <div className="ml-auto flex flex-wrap gap-2">
                {selectionAllFolderless && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 bg-background"
                    onClick={() => setScheduleIds([...selected])}
                  >
                    <CalendarClock className="h-4 w-4" />
                    Programar
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 bg-background"
                  onClick={() => setMoveIds([...selected])}
                >
                  <FolderInput className="h-4 w-4" />
                  Mover
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 bg-background text-destructive hover:text-destructive"
                  onClick={() => setDeletingMany(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </div>
          )}

          {/* Selecionar todas */}
          {!loading && filtered.length > 0 && (
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
              Selecionar todas ({filtered.length})
            </label>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed bg-card">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-medium text-foreground">
                  {search || activeFolder !== "all"
                    ? "Nenhuma mídia encontrada"
                    : "Nenhum conteúdo ainda"}
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {search || activeFolder !== "all"
                    ? "Tente ajustar a pesquisa ou os filtros."
                    : "Faça upload de imagens ou vídeos, ou importe posts do Instagram."}
                </p>
              </CardContent>
            </Card>
          ) : canReorder ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={filtered.map((c) => c.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((content) => (
                    <SortableContentCard
                      key={content.id}
                      content={content}
                      selected={selected.has(content.id)}
                      onToggleSelect={toggleSelect}
                      onEdit={setEditing}
                      onSchedule={(c) => setScheduleIds([c.id])}
                      onMove={(c) => setMoveIds([c.id])}
                      onDelete={setDeletingOne}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((content) => (
                <ContentCard
                  key={content.id}
                  content={content}
                  selected={selected.has(content.id)}
                  onToggleSelect={toggleSelect}
                  onEdit={setEditing}
                  onSchedule={(c) => setScheduleIds([c.id])}
                  onMove={(c) => setMoveIds([c.id])}
                  onDelete={setDeletingOne}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editar */}
      <EditContentDialog content={editing} onClose={() => setEditing(null)} onSave={onUpdate} />

      {/* Mover */}
      <MoveContentDialog
        open={!!moveIds}
        count={moveIds?.length ?? 0}
        folders={folders}
        onClose={() => setMoveIds(null)}
        onMove={async (folderId) => {
          if (!moveIds) return
          await onMove(moveIds, folderId)
          clearSelection()
        }}
      />

      {/* Programar mídias individuais (somente "Sem pasta") */}
      <ScheduleContentDialog
        open={!!scheduleIds}
        count={scheduleIds?.length ?? 0}
        onClose={() => setScheduleIds(null)}
        onSchedule={async (config) => {
          if (!scheduleIds) return
          await onSchedule(scheduleIds, config)
          clearSelection()
        }}
      />

      {/* Programar pasta (automação por pasta) */}
      <ScheduleFolderDialog
        open={!!schedulingFolder}
        folder={schedulingFolder}
        automation={schedulingFolder ? automationByFolder.get(schedulingFolder.id) ?? null : null}
        instagramAccounts={currentInstagramAccounts}
        onClose={() => setSchedulingFolder(null)}
        onSave={onSaveFolderAutomation}
        onRemove={onRemoveFolderAutomation}
      />

      {/* Excluir individual */}
      <AlertDialog open={!!deletingOne} onOpenChange={(o) => !o && setDeletingOne(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conteúdo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O conteúdo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deletingOne) return
                try {
                  await onDelete(deletingOne.id)
                  toast.success("Conteúdo excluído.")
                } catch {
                  toast.error("Erro ao excluir conteúdo.")
                } finally {
                  setDeletingOne(null)
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Excluir em lote */}
      <AlertDialog open={deletingMany} onOpenChange={setDeletingMany}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.size} mídia(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. As mídias selecionadas serão removidas
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                try {
                  await onDeleteMany([...selected])
                  toast.success("Mídias excluídas.")
                  clearSelection()
                } catch {
                  toast.error("Erro ao excluir mídias.")
                } finally {
                  setDeletingMany(false)
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}

function FolderInfoPanel({
  folder,
  automation,
  activeCount,
  onSchedule,
}: {
  folder: StoryFolder
  automation: StoryAutomation | null
  activeCount: number
  onSchedule: () => void
}) {
  const status = getFolderAutomationStatus(automation, activeCount)
  const nextPublication = formatNextPublicationBR(automation)

  const stats: { label: string; value: string }[] = [
    { label: "Mídias", value: String(folder.content_count ?? 0) },
    {
      label: "Próxima publicação",
      value: status === "active" && nextPublication ? nextPublication : "—",
    },
    {
      label: "Frequência",
      value: automation ? formatAutomationFrequency(automation) : "—",
    },
    {
      label: "Horário",
      value: automation ? formatTimeBR(automation.execution_time) : "—",
    },
    {
      label: "Publicação",
      value: automation ? STORY_PUBLISH_MODE_LABELS[automation.publish_mode] : "—",
    },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${FOLDER_STATUS_DOT[status]}`} />
            <h2 className="truncate text-base font-semibold text-foreground">{folder.name}</h2>
          </div>
          <p className={`mt-0.5 text-xs font-medium ${FOLDER_STATUS_TEXT[status]}`}>
            {FOLDER_STATUS_LABELS[status]}
          </p>
        </div>
        <Button
          variant={automation ? "outline" : "default"}
          size="sm"
          className="gap-2 sm:shrink-0"
          onClick={onSchedule}
        >
          <CalendarClock className="h-4 w-4" />
          {automation ? "Editar programação" : "Programar pasta"}
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="truncate text-sm font-medium text-foreground">{s.value}</p>
          </div>
        ))}
      </div>
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
  const [name, setName] = useState("")
  const [caption, setCaption] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  return (
    <Dialog open={!!content} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        onOpenAutoFocus={() => {
          setName(content?.name || "")
          setCaption(content?.caption || "")
          setIsActive(content?.is_active ?? true)
        }}
      >
        <DialogHeader>
          <DialogTitle>Editar conteúdo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="content-name">Nome</Label>
            <Input
              id="content-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da mídia"
            />
          </div>
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
                await onSave(content.id, { name, caption, is_active: isActive })
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
