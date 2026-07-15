"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  CalendarClock,
  MoreHorizontal,
  Pencil,
  Pause,
  Play,
  Copy,
  Trash2,
  Video,
  ImageIcon,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import type { StorySchedule, StoryFolder, ScheduleConfigInput } from "@/lib/types/stories"
import {
  getScheduleDisplayStatus,
  formatScheduleFrequency,
  formatDateBR,
  formatDateTimeBR,
  formatTimeBR,
  SCHEDULE_DISPLAY_STATUS_LABELS,
  SCHEDULE_DISPLAY_STATUS_STYLES,
  type ScheduleDisplayStatus,
} from "@/lib/utils/schedule-display"
import { EditScheduleDialog } from "@/components/stories/edit-schedule-dialog"

interface Company {
  id: string
  name: string
}

interface SchedulesTabProps {
  schedules: StorySchedule[]
  folders: StoryFolder[]
  companies: Company[]
  loading: boolean
  onUpdate: (id: string, config: ScheduleConfigInput) => Promise<void>
  onAction: (id: string, action: "pause" | "resume" | "duplicate") => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function SchedulesTab({
  schedules,
  folders,
  companies,
  loading,
  onUpdate,
  onAction,
  onDelete,
}: SchedulesTabProps) {
  const [search, setSearch] = useState("")
  const [companyFilter, setCompanyFilter] = useState("all")
  const [folderFilter, setFolderFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<"all" | ScheduleDisplayStatus>("all")
  const [editing, setEditing] = useState<StorySchedule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StorySchedule | null>(null)

  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      if (search && !(s.content_name || "").toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      if (companyFilter !== "all" && s.company_id !== companyFilter) return false
      if (folderFilter !== "all") {
        if (folderFilter === "none" ? s.folder_id != null : s.folder_id !== folderFilter) {
          return false
        }
      }
      if (statusFilter !== "all" && getScheduleDisplayStatus(s) !== statusFilter) return false
      return true
    })
  }, [schedules, search, companyFilter, folderFilter, statusFilter])

  const handleAction = async (id: string, action: "pause" | "resume" | "duplicate") => {
    try {
      await onAction(id, action)
      toast.success(
        action === "pause"
          ? "Agendamento pausado."
          : action === "resume"
            ? "Agendamento retomado."
            : "Agendamento duplicado.",
      )
    } catch {
      toast.error("Não foi possível concluir a ação.")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await onDelete(deleteTarget.id)
      toast.success("Agendamento excluído.")
    } catch {
      toast.error("Erro ao excluir agendamento.")
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <Card className="bg-card">
      <CardContent className="space-y-4 p-4 sm:p-6">
        {/* Filtros */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome da mídia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={folderFilter} onValueChange={setFolderFilter}>
              <SelectTrigger className="w-full sm:w-44">
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

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "all" | ScheduleDisplayStatus)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="finished">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <CalendarClock className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground">Nenhum agendamento</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Programe mídias na aba Conteúdos para vê-las aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Mídia</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Pasta</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Próxima execução</TableHead>
                  <TableHead>Data final</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const status = getScheduleDisplayStatus(s)
                  const thumb = s.content_thumbnail_url || s.content_file_url
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb || "/placeholder.svg"}
                            alt={s.content_name || "Mídia"}
                            className="h-10 w-10 rounded object-cover"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                            {s.content_type === "video" ? (
                              <Video className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate font-medium">
                        {s.content_name || "Sem nome"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {s.company_name || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {s.folder_name || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatScheduleFrequency(s)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatTimeBR(s.execution_time)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTimeBR(s.next_execution)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDateBR(s.end_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={SCHEDULE_DISPLAY_STATUS_STYLES[status]}>
                          {SCHEDULE_DISPLAY_STATUS_LABELS[status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditing(s)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            {status === "paused" ? (
                              <DropdownMenuItem onClick={() => handleAction(s.id, "resume")}>
                                <Play className="mr-2 h-4 w-4" />
                                Retomar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleAction(s.id, "pause")}
                                disabled={status === "finished"}
                              >
                                <Pause className="mr-2 h-4 w-4" />
                                Pausar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleAction(s.id, "duplicate")}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(s)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <EditScheduleDialog
        open={!!editing}
        schedule={editing}
        onClose={() => setEditing(null)}
        onSave={onUpdate}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O agendamento de{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.content_name || "esta mídia"}
              </span>{" "}
              será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
