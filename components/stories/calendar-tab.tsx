"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Building2, CalendarClock } from "lucide-react"
import type { StorySchedule } from "@/lib/types/stories"
import {
  getScheduleDisplayStatus,
  formatTimeBR,
  SCHEDULE_EVENT_STYLES,
} from "@/lib/utils/schedule-display"
import { ScheduleDetailModal } from "@/components/stories/schedule-detail-modal"
import { EditScheduleDialog } from "@/components/stories/edit-schedule-dialog"

interface Company {
  id: string
  name: string
}

interface CalendarTabProps {
  schedules: StorySchedule[]
  loading: boolean
  companies: Company[]
  companyId: string | null
  onCompanyChange: (id: string) => void
  onUpdate: (id: string, config: import("@/lib/types/stories").ScheduleConfigInput) => Promise<void>
  onAction: (id: string, action: "pause" | "resume" | "duplicate") => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const WEEKDAY_HEADERS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// Fim efetivo de um agendamento: end_date explícito ou derivado de total_weeks.
function effectiveEnd(schedule: StorySchedule): Date | null {
  if (schedule.end_date) {
    const e = new Date(schedule.end_date)
    if (!Number.isNaN(e.getTime())) return startOfDay(e)
  }
  if (schedule.total_weeks && schedule.start_date) {
    const start = new Date(schedule.start_date)
    if (!Number.isNaN(start.getTime())) {
      return startOfDay(addDays(start, schedule.total_weeks * 7))
    }
  }
  return null
}

// Determina se um agendamento ocorre em um dia específico, a partir das regras
// já existentes (frequência, início, fim, intervalo e dias da semana).
function occursOn(schedule: StorySchedule, day: Date): boolean {
  const d = startOfDay(day)
  if (schedule.start_date) {
    const start = startOfDay(new Date(schedule.start_date))
    if (!Number.isNaN(start.getTime()) && d < start) return false
  }
  const end = effectiveEnd(schedule)
  if (end && d > end) return false

  switch (schedule.frequency_type) {
    case "daily":
      return true
    case "interval": {
      if (!schedule.start_date) return false
      const start = startOfDay(new Date(schedule.start_date))
      const diffDays = Math.round((d.getTime() - start.getTime()) / 86400000)
      const step = schedule.interval_days || 1
      return diffDays >= 0 && diffDays % step === 0
    }
    case "weekdays":
      return (schedule.weekdays || []).includes(d.getDay())
    default:
      return false
  }
}

export function CalendarTab({
  schedules,
  loading,
  companies,
  companyId,
  onCompanyChange,
  onUpdate,
  onAction,
  onDelete,
}: CalendarTabProps) {
  const [cursor, setCursor] = useState(() => startOfDay(new Date()))
  const [detail, setDetail] = useState<StorySchedule | null>(null)
  const [editing, setEditing] = useState<StorySchedule | null>(null)

  const today = startOfDay(new Date())
  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  // Constrói a grade do mês (semanas completas de domingo a sábado).
  const weeks = useMemo(() => {
    const first = new Date(year, month, 1)
    const gridStart = addDays(startOfDay(first), -first.getDay())
    const days: Date[] = []
    for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i))
    const result: Date[][] = []
    for (let i = 0; i < 6; i++) result.push(days.slice(i * 7, i * 7 + 7))
    return result
  }, [year, month])

  // Considera apenas agendamentos que não estão finalizados para exibição.
  const visibleSchedules = useMemo(
    () => schedules.filter((s) => getScheduleDisplayStatus(s) !== "finished"),
    [schedules],
  )

  const eventsForDay = (day: Date): StorySchedule[] =>
    visibleSchedules.filter((s) => occursOn(s, day))

  const monthLabel = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  const handleToggle = async (schedule: StorySchedule) => {
    const status = getScheduleDisplayStatus(schedule)
    if (status === "finished") return
    try {
      await onAction(schedule.id, status === "paused" ? "resume" : "pause")
      setDetail(null)
    } catch {
      // erro tratado pela camada de dados
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-1 text-sm font-semibold capitalize text-foreground">
            {monthLabel}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-1"
            onClick={() => setCursor(startOfDay(new Date()))}
          >
            Hoje
          </Button>
        </div>

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
      </div>

      {loading ? (
        <Skeleton className="h-[560px] w-full rounded-xl" />
      ) : (
        <Card className="overflow-hidden bg-card">
          <CardContent className="p-0">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/40">
              {WEEKDAY_HEADERS.map((w) => (
                <div
                  key={w}
                  className="py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Grade */}
            <div className="grid grid-cols-7">
              {weeks.flat().map((day, idx) => {
                const inMonth = day.getMonth() === month
                const isToday = sameDay(day, today)
                const events = eventsForDay(day)
                const shown = events.slice(0, 3)
                const extra = events.length - shown.length
                return (
                  <div
                    key={idx}
                    className={`min-h-24 border-b border-r border-border p-1.5 ${
                      idx % 7 === 6 ? "border-r-0" : ""
                    } ${inMonth ? "" : "bg-muted/20"}`}
                  >
                    <div className="mb-1 flex justify-end">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          isToday
                            ? "bg-primary font-semibold text-primary-foreground"
                            : inMonth
                              ? "text-foreground"
                              : "text-muted-foreground"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {shown.map((s) => {
                        const status = getScheduleDisplayStatus(s)
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setDetail(s)}
                            className={`flex w-full items-center gap-1 rounded border-l-2 px-1.5 py-1 text-left text-[11px] leading-tight transition-opacity hover:opacity-80 ${SCHEDULE_EVENT_STYLES[status]}`}
                            title={s.content_name || "Publicação"}
                          >
                            <span className="shrink-0 font-medium">
                              {formatTimeBR(s.execution_time)}
                            </span>
                            <span className="truncate">{s.content_name || "Publicação"}</span>
                          </button>
                        )
                      })}
                      {extra > 0 && (
                        <p className="px-1 text-[11px] text-muted-foreground">+{extra} mais</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legenda */}
      {!loading && (
        <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Ativo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Pausado
          </span>
          {visibleSchedules.length === 0 && (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" /> Nenhuma publicação programada
            </span>
          )}
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
        onDelete={async (s) => {
          setDetail(null)
          try {
            await onDelete(s.id)
          } catch {
            // erro tratado pela camada de dados
          }
        }}
      />

      {/* Editar */}
      <EditScheduleDialog
        open={!!editing}
        schedule={editing}
        onClose={() => setEditing(null)}
        onSave={onUpdate}
      />
    </div>
  )
}
