"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Loader2, CalendarClock } from "lucide-react"
import { toast } from "sonner"
import {
  WEEKDAY_LABELS,
  type ScheduleConfigInput,
  type ScheduleFrequencyType,
  type ScheduleExecutionMode,
} from "@/lib/types/stories"

interface ScheduleContentDialogProps {
  open: boolean
  count: number
  onClose: () => void
  onSchedule: (config: ScheduleConfigInput) => Promise<void>
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ScheduleContentDialog({
  open,
  count,
  onClose,
  onSchedule,
}: ScheduleContentDialogProps) {
  const [frequencyType, setFrequencyType] = useState<ScheduleFrequencyType>("daily")
  const [intervalDays, setIntervalDays] = useState(2)
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [executionTime, setExecutionTime] = useState("08:00")
  const [startDate, setStartDate] = useState(todayISO())
  const [totalWeeks, setTotalWeeks] = useState<number | "">("")
  const [executionMode, setExecutionMode] = useState<ScheduleExecutionMode>("sequential")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setFrequencyType("daily")
      setIntervalDays(2)
      setWeekdays([])
      setExecutionTime("08:00")
      setStartDate(todayISO())
      setTotalWeeks("")
      setExecutionMode("sequential")
    }
  }, [open])

  const handleSave = async () => {
    if (frequencyType === "weekdays" && weekdays.length === 0) {
      toast.error("Selecione ao menos um dia da semana.")
      return
    }
    setSaving(true)
    try {
      await onSchedule({
        frequency_type: frequencyType,
        interval_days: frequencyType === "interval" ? intervalDays : undefined,
        weekdays: frequencyType === "weekdays" ? weekdays : undefined,
        execution_time: executionTime,
        start_date: startDate,
        total_weeks: totalWeeks === "" ? null : Number(totalWeeks),
        execution_mode: executionMode,
      })
      toast.success(count > 1 ? "Mídias programadas." : "Mídia programada.")
      onClose()
    } catch {
      toast.error("Erro ao programar.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Programar {count > 1 ? `${count} mídias` : "publicação"}
          </DialogTitle>
          <DialogDescription>
            Defina quando estas mídias serão publicadas nos Stories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Frequência */}
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select
              value={frequencyType}
              onValueChange={(v) => setFrequencyType(v as ScheduleFrequencyType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Todos os dias</SelectItem>
                <SelectItem value="interval">A cada X dias</SelectItem>
                <SelectItem value="weekdays">Dias específicos</SelectItem>
              </SelectContent>
            </Select>

            {frequencyType === "interval" && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm text-muted-foreground">A cada</span>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(Math.max(1, Number(e.target.value)))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">dia(s)</span>
              </div>
            )}

            {frequencyType === "weekdays" && (
              <ToggleGroup
                type="multiple"
                value={weekdays.map(String)}
                onValueChange={(vals) => setWeekdays(vals.map(Number).sort())}
                className="flex flex-wrap justify-start gap-2 pt-1"
              >
                {WEEKDAY_LABELS.map((label, index) => (
                  <ToggleGroupItem
                    key={index}
                    value={String(index)}
                    className="h-9 w-12 border border-border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          </div>

          {/* Horário + início */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-time">Horário</Label>
              <Input
                id="schedule-time"
                type="time"
                value={executionTime}
                onChange={(e) => setExecutionTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-start">Início</Label>
              <Input
                id="schedule-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          {/* Duração + modo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-weeks">Duração (semanas)</Label>
              <Input
                id="schedule-weeks"
                type="number"
                min={1}
                max={52}
                placeholder="Sem limite"
                value={totalWeeks}
                onChange={(e) =>
                  setTotalWeeks(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))
                }
              />
            </div>
            {count > 1 && (
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Select
                  value={executionMode}
                  onValueChange={(v) => setExecutionMode(v as ScheduleExecutionMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequential">Sequencial</SelectItem>
                    <SelectItem value="random">Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button className="gap-2" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Programar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
