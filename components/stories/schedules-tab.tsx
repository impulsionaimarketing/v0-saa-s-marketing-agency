"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Search,
  Building2,
  Filter,
  ArrowDownUp,
  CalendarClock,
  Video,
  Image as ImageIcon,
  Pause,
  Play,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import type { StorySchedule, ScheduleConfigInput } from "@/lib/types/stories"
import {
  getScheduleDisplayStatus,
  formatScheduleFrequency,
  formatDateTimeBR,
  formatTimeBR,
  SCHEDULE_DISPLAY_STATUS_LABELS,
  SCHEDULE_DISPLAY_STATUS_STYLES,
  type ScheduleDisplayStatus,
} from "@/lib/utils/schedule-display"
import { ScheduleDetailModal } from "@/components/stories/schedule-detail-modal"
import { EditScheduleDialog } from "@/components/stories/edit-schedule-dialog"

interface Company {
  id: string
  name: string
}

type StatusFilter = "all" | ScheduleDisplayStatus
type SortOption = "next" | "recent" | "name"

interface SchedulesTabProps {
  schedules: StorySchedule[]
  loading: boolean
  companies: Company[]
  companyId: string | null
  onCompanyChange: (id: string) => void
  onUpdate: (id: string, config: ScheduleConfigInput) => Promise<void>
  onAction: (id: string, action: "pause" | "resume" | "duplicate") => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function SchedulesTab({
  schedules,
  loading,
  companies,
  companyId,
  onCompanyChange,
  onUpdate,
  onAction,
  onDelete,
}: SchedulesTabProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sort, setSort] = useState<SortOption>("next")

  const [detail, setDetail] = useState<StorySchedule | null>(null)
  const [editing, setEditing] = useState<StorySchedule | null>(null)
  const [deleting, setDeleting] = useState<StorySchedule | null>(null)

  const filtered = useMemo(() => {
    let list = schedules
    if (statusFilter !== "all") {
      list = list.filter((s) => getScheduleDisplayStatus(s) === statusFilter)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((s) =>
        [s.content_name, s.folder_name, s.company_name].some((v) => v?.toLowerCase().includes(q)),
      )
    }
    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sort === "name") return (a.content_name || "").localeCompare(b.content_name || "")
      if (sort === "recent") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      // next execution ascending (nulos por último)
      const na = a.next_execution ? new Date(a.next_execution).getTime() : Infinity
      const nb = b.next_execution ? new Date(b.next_execution).getTime() : Infinity
      return na - nb
    })
    return sorted
  }, [schedules, statusFilter, search, sort])

  const handleToggle = async (schedule: StorySchedule) => {
    const status = getScheduleDisplayStatus(schedule)
    if (status === "finished") return
    try {
      await onAction(schedule.id, status === "paused" ? "resume" : "pause")
      toast.success(status === "paused" ? "Agendamento retomado." : "Agendamento pausado.")
      setDetail(null)
    } catch {
      toast.error("Erro ao atualizar agendamento.")
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 xl:flex-row xl:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar agendamentos..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full gap-2 sm:w-40">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
              <SelectItem value="finished">Finalizado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-full gap-2 sm:w-44">
              <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="next">Próxima execução</SelectItem>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <CalendarClock className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground">
              {search || statusFilter !== "all"
                ? "Nenhum agendamento encontrado"
                : "Nenhum agendamento ainda"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {search || statusFilter !== "all"
                ? "Tente ajustar a pesquisa ou os filtros."
                : "Programe mídias na aba Conteúdos para vê-las aqui."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((schedule) => (
            <ScheduleRow
              key={schedule.id}
              schedule={schedule}
              onOpen={() => setDetail(schedule)}
              onEdit={() => setEditing(schedule)}
              onToggle={() => handleToggle(schedule)}
              onDelete={() => setDeleting(schedule)}
            />
          ))}
        </div>
      )}

      {/* Detalhe */}
      <ScheduleDetailModal
        schedule={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        onEdit={(s) => {
          setDetail(null)
          setEditing(s)
        }}
        onToggle={handleToggle}
        onDelete={(s) => {
          setDetail(null)
          setDeleting(s)
        }}
      />

      {/* Editar */}
      <EditScheduleDialog
        open={!!editing}
        schedule={editing}
        onClose={() => setEditing(null)}
        onSave={onUpdate}
      />

      {/* Excluir */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A mídia não será excluída, apenas a programação.
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
                  toast.success("Agendamento excluído.")
                } catch {
                  toast.error("Erro ao excluir agendamento.")
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

function ScheduleRow({
  schedule,
  onOpen,
  onEdit,
  onToggle,
  onDelete,
}: {
  schedule: StorySchedule
  onOpen: () => void
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const status = getScheduleDisplayStatus(schedule)
  const thumb = schedule.content_thumbnail_url || schedule.content_file_url
  const isVideo = schedule.content_type === "video"

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen()
        }
      }}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/40"
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {thumb ? (
          <Image
            src={thumb || "/placeholder.svg"}
            alt={schedule.content_name || "Mídia"}
            fill
            className="object-cover"
            crossOrigin="anonymous"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            {isVideo ? (
              <Video className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {schedule.content_name || "Publicação"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {schedule.folder_name || "Sem pasta"} · {formatScheduleFrequency(schedule)} ·{" "}
          {formatTimeBR(schedule.execution_time)}
        </p>
      </div>

      {/* Próxima execução */}
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Próxima</p>
        <p className="text-xs font-medium text-foreground">
          {formatDateTimeBR(schedule.next_execution)}
        </p>
      </div>

      {/* Status */}
      <Badge variant="outline" className={`shrink-0 ${SCHEDULE_DISPLAY_STATUS_STYLES[status]}`}>
        {SCHEDULE_DISPLAY_STATUS_LABELS[status]}
      </Badge>

      {/* Ações */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {status !== "finished" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            aria-label={status === "paused" ? "Retomar" : "Pausar"}
          >
            {status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          aria-label="Editar"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
