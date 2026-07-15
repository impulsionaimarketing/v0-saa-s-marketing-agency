"use client"

import { useMemo, useState } from "react"
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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
import { ChevronLeft, ChevronRight, Video, ImageIcon, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { StorySchedule, ScheduleConfigInput } from "@/lib/types/stories"
import {
  getScheduleDisplayStatus,
  formatTimeBR,
  SCHEDULE_EVENT_STYLES,
} from "@/lib/utils/schedule-display"
import { ScheduleDetailModal } from "@/components/stories/schedule-detail-modal"
import { EditScheduleDialog } from "@/components/stories/edit-schedule-dialog"

interface CalendarEvent {
  date: Date
  schedule: StorySchedule
}

type ViewMode = "month" | "week"

interface CalendarTabProps {
  schedules: StorySchedule[]
  loading: boolean
  onUpdate: (id: string, config: ScheduleConfigInput) => Promise<void>
  onAction: (id: string, action: "pause" | "resume" | "duplicate") => Promise<void>
  onDelete: (id: string) => Promise<void>
}

// Gera as ocorrências de um agendamento dentro de um intervalo visível,
// respeitando frequência, data inicial/final e horário de execução.
function getOccurrences(schedule: StorySchedule, rangeStart: Date, rangeEnd: Date): Date[] {
  const start = schedule.start_date ? startOfDay(new Date(schedule.start_date)) : null
  if (!start || Number.isNaN(start.getTime())) return []
  const end = schedule.end_date ? startOfDay(new Date(schedule.end_date)) : null

  const [h, m] = (schedule.execution_time || "08:00").split(":").map(Number)
  const results: Date[] = []

  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
  for (const day of days) {
    const d = startOfDay(day)
    if (d < start) continue
    if (end && d > end) continue

    let matches = false
    if (schedule.frequency_type === "daily") {
      matches = true
    } else if (schedule.frequency_type === "interval") {
      const step = Math.max(1, schedule.interval_days || 1)
      const diffDays = Math.round((d.getTime() - start.getTime()) / 86_400_000)
      matches = diffDays % step === 0
    } else if (schedule.frequency_type === "weekdays") {
      matches = (schedule.weekdays || []).includes(d.getDay())
    }

    if (matches) {
      const occurrence = new Date(d)
      occurrence.setHours(h || 0, m || 0, 0, 0)
      results.push(occurrence)
    }
  }
  return results
}

const WEEKDAY_HEADERS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function EventChip({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const status = getScheduleDisplayStatus(event.schedule)
  const thumb = event.schedule.content_thumbnail_url || event.schedule.content_file_url
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-1.5 overflow-hidden rounded border-l-2 px-1.5 py-1 text-left text-xs transition-colors hover:brightness-95",
        SCHEDULE_EVENT_STYLES[status],
      )}
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb || "/placeholder.svg"}
          alt=""
          className="h-4 w-4 shrink-0 rounded-sm object-cover"
          crossOrigin="anonymous"
        />
      ) : event.schedule.content_type === "video" ? (
        <Video className="h-3 w-3 shrink-0" />
      ) : (
        <ImageIcon className="h-3 w-3 shrink-0" />
      )}
      <span className="shrink-0 font-medium tabular-nums">{format(event.date, "HH:mm")}</span>
      <span className="truncate text-muted-foreground">
        {event.schedule.company_name || event.schedule.content_name || ""}
      </span>
    </button>
  )
}

export function CalendarTab({ schedules, loading, onUpdate, onAction, onDelete }: CalendarTabProps) {
  const [view, setView] = useState<ViewMode>("month")
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState<StorySchedule | null>(null)
  const [editing, setEditing] = useState<StorySchedule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StorySchedule | null>(null)

  const { rangeStart, rangeEnd, days } = useMemo(() => {
    if (view === "month") {
      const monthStart = startOfMonth(cursor)
      const monthEnd = endOfMonth(cursor)
      const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
      const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
      return {
        rangeStart: gridStart,
        rangeEnd: gridEnd,
        days: eachDayOfInterval({ start: gridStart, end: gridEnd }),
      }
    }
    const weekStart = startOfWeek(cursor, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(cursor, { weekStartsOn: 0 })
    return {
      rangeStart: weekStart,
      rangeEnd: weekEnd,
      days: eachDayOfInterval({ start: weekStart, end: weekEnd }),
    }
  }, [view, cursor])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const schedule of schedules) {
      const occurrences = getOccurrences(schedule, rangeStart, rangeEnd)
      for (const date of occurrences) {
        const key = format(date, "yyyy-MM-dd")
        const list = map.get(key) ?? []
        list.push({ date, schedule })
        map.set(key, list)
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.date.getTime() - b.date.getTime())
    }
    return map
  }, [schedules, rangeStart, rangeEnd])

  const goPrev = () => setCursor((c) => (view === "month" ? subMonths(c, 1) : subWeeks(c, 1)))
  const goNext = () => setCursor((c) => (view === "month" ? addMonths(c, 1) : addWeeks(c, 1)))
  const goToday = () => setCursor(new Date())

  const title =
    view === "month"
      ? format(cursor, "MMMM 'de' yyyy", { locale: ptBR })
      : `${format(rangeStart, "dd MMM", { locale: ptBR })} – ${format(addDays(rangeStart, 6), "dd MMM", { locale: ptBR })}`

  const handleToggle = async (schedule: StorySchedule) => {
    const status = getScheduleDisplayStatus(schedule)
    try {
      await onAction(schedule.id, status === "paused" ? "resume" : "pause")
      toast.success(status === "paused" ? "Agendamento retomado." : "Agendamento pausado.")
      setSelected(null)
    } catch {
      toast.error("Não foi possível concluir a ação.")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await onDelete(deleteTarget.id)
      toast.success("Agendamento excluído.")
      setSelected(null)
    } catch {
      toast.error("Erro ao excluir agendamento.")
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <Card className="bg-card">
      <CardContent className="space-y-4 p-4 sm:p-6">
        {/* Cabeçalho de navegação */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goPrev} aria-label="Anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goNext} aria-label="Próximo">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              Hoje
            </Button>
            <h3 className="ml-1 text-base font-semibold capitalize text-foreground">{title}</h3>
          </div>

          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as ViewMode)}
            className="justify-start"
          >
            <ToggleGroupItem value="month" className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              <CalendarDays className="h-4 w-4" />
              Mês
            </ToggleGroupItem>
            <ToggleGroupItem value="week" className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              <CalendarDays className="h-4 w-4" />
              Semana
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {loading ? (
          <Skeleton className="h-[520px] w-full" />
        ) : (
          <div className="overflow-hidden rounded-md border">
            {/* Cabeçalho de dias da semana */}
            <div className="grid grid-cols-7 border-b bg-muted/50">
              {WEEKDAY_HEADERS.map((label) => (
                <div
                  key={label}
                  className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Grade de dias */}
            <div className={cn("grid grid-cols-7", view === "week" && "min-h-[520px]")}>
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd")
                const events = eventsByDay.get(key) ?? []
                const inMonth = view === "week" || isSameMonth(day, cursor)
                const isToday = isSameDay(day, new Date())
                const visible = view === "month" ? events.slice(0, 3) : events
                const extra = view === "month" ? events.length - visible.length : 0

                return (
                  <div
                    key={key}
                    className={cn(
                      "flex flex-col gap-1 border-b border-r p-1.5 last:border-r-0",
                      view === "month" ? "min-h-[104px]" : "min-h-[520px]",
                      !inMonth && "bg-muted/30",
                    )}
                  >
                    <div className="flex justify-end">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                          isToday
                            ? "bg-primary font-semibold text-primary-foreground"
                            : inMonth
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {visible.map((event, i) => (
                        <EventChip
                          key={`${event.schedule.id}-${i}`}
                          event={event}
                          onClick={() => setSelected(event.schedule)}
                        />
                      ))}
                      {extra > 0 && (
                        <span className="px-1 text-[11px] font-medium text-muted-foreground">
                          +{extra} mais
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>

      <ScheduleDetailModal
        schedule={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEdit={(s) => {
          setSelected(null)
          setEditing(s)
        }}
        onToggle={handleToggle}
        onDelete={(s) => {
          setSelected(null)
          setDeleteTarget(s)
        }}
      />

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
