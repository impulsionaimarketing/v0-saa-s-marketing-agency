import { WEEKDAY_LABELS, type StorySchedule } from "@/lib/types/stories"

// Status de exibição consolidado para a UI (independente de integração).
export type ScheduleDisplayStatus = "active" | "paused" | "finished"

export const SCHEDULE_DISPLAY_STATUS_LABELS: Record<ScheduleDisplayStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  finished: "Finalizado",
}

export const SCHEDULE_DISPLAY_STATUS_STYLES: Record<ScheduleDisplayStatus, string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  paused: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  finished: "bg-muted text-muted-foreground border-border",
}

// Cores usadas nos eventos do calendário.
export const SCHEDULE_EVENT_STYLES: Record<ScheduleDisplayStatus, string> = {
  active: "border-l-primary bg-primary/10 text-foreground",
  paused: "border-l-amber-500 bg-amber-500/10 text-foreground",
  finished: "border-l-muted-foreground bg-muted text-muted-foreground",
}

export function getScheduleDisplayStatus(schedule: StorySchedule): ScheduleDisplayStatus {
  if (schedule.status === "paused" || schedule.enabled === false) return "paused"
  if (schedule.status === "published" || schedule.status === "failed") return "finished"
  if (schedule.end_date) {
    const end = new Date(schedule.end_date)
    if (!Number.isNaN(end.getTime()) && end.getTime() < Date.now()) return "finished"
  }
  return "active"
}

export function formatScheduleFrequency(schedule: StorySchedule): string {
  switch (schedule.frequency_type) {
    case "daily":
      return "Todos os dias"
    case "interval":
      return `A cada ${schedule.interval_days || 1} dia(s)`
    case "weekdays":
      if (!schedule.weekdays || schedule.weekdays.length === 0) return "Dias específicos"
      return schedule.weekdays
        .slice()
        .sort((a, b) => a - b)
        .map((d) => WEEKDAY_LABELS[d])
        .join(", ")
    default:
      return "—"
  }
}

export function formatDateBR(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function formatDateTimeBR(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatTimeBR(value: string | null | undefined): string {
  if (!value) return "—"
  // execution_time chega como "HH:MM:SS" ou "HH:MM"
  const match = /^(\d{2}):(\d{2})/.exec(value)
  if (match) return `${match[1]}:${match[2]}`
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}
