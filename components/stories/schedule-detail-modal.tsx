"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Pencil, Pause, Play, Trash2, Video, Building2, FolderClosed, Clock, CalendarClock, CalendarRange } from "lucide-react"
import type { StorySchedule } from "@/lib/types/stories"
import {
  getScheduleDisplayStatus,
  formatScheduleFrequency,
  formatDateBR,
  formatDateTimeBR,
  formatTimeBR,
  SCHEDULE_DISPLAY_STATUS_LABELS,
  SCHEDULE_DISPLAY_STATUS_STYLES,
} from "@/lib/utils/schedule-display"

interface ScheduleDetailModalProps {
  schedule: StorySchedule | null
  open: boolean
  onClose: () => void
  onEdit: (schedule: StorySchedule) => void
  onToggle: (schedule: StorySchedule) => void
  onDelete: (schedule: StorySchedule) => void
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function ScheduleDetailModal({
  schedule,
  open,
  onClose,
  onEdit,
  onToggle,
  onDelete,
}: ScheduleDetailModalProps) {
  if (!schedule) return null

  const status = getScheduleDisplayStatus(schedule)
  const thumb = schedule.content_thumbnail_url || schedule.content_file_url
  const isVideo = schedule.content_type === "video"

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 pr-6">
            <span className="truncate">{schedule.content_name || "Publicação"}</span>
            <Badge variant="outline" className={SCHEDULE_DISPLAY_STATUS_STYLES[status]}>
              {SCHEDULE_DISPLAY_STATUS_LABELS[status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Preview da mídia */}
          <div className="relative overflow-hidden rounded-lg border bg-muted">
            {isVideo && schedule.content_file_url ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                src={schedule.content_file_url}
                className="max-h-64 w-full object-contain"
                controls
                crossOrigin="anonymous"
              />
            ) : thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumb || "/placeholder.svg"}
                alt={schedule.content_name || "Mídia"}
                className="max-h-64 w-full object-contain"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex h-40 items-center justify-center">
                <Video className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-2 gap-4">
            <InfoRow icon={Building2} label="Empresa" value={schedule.company_name || "—"} />
            <InfoRow icon={FolderClosed} label="Pasta" value={schedule.folder_name || "Sem pasta"} />
            <InfoRow icon={CalendarClock} label="Frequência" value={formatScheduleFrequency(schedule)} />
            <InfoRow icon={Clock} label="Horário" value={formatTimeBR(schedule.execution_time)} />
            <InfoRow
              icon={CalendarClock}
              label="Próxima execução"
              value={formatDateTimeBR(schedule.next_execution)}
            />
            <InfoRow icon={CalendarRange} label="Data inicial" value={formatDateBR(schedule.start_date)} />
            <InfoRow icon={CalendarRange} label="Data final" value={formatDateBR(schedule.end_date)} />
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => onEdit(schedule)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            {status === "paused" ? (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => onToggle(schedule)}>
                <Play className="h-4 w-4" />
                Retomar
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => onToggle(schedule)}
                disabled={status === "finished"}
              >
                <Pause className="h-4 w-4" />
                Pausar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-2 text-destructive hover:text-destructive"
              onClick={() => onDelete(schedule)}
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
