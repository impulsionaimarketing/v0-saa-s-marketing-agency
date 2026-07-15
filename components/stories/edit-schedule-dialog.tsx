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
  type StorySchedule,
  type ScheduleConfigInput,
  type ScheduleFrequencyType,
  type ScheduleExecutionMode,
} from "@/lib/types/stories"

interface EditScheduleDialogProps {
  open: boolean
  schedule: StorySchedule | null
  onClose: () => void
  onSave: (id: string, config: ScheduleConfigInput) => Promise<void>
}

export function EditScheduleDialog({ open, schedule, onClose, onSave }: EditScheduleDialogProps) {
  const [frequencyType, setFrequencyType] = useState<ScheduleFrequencyType>("daily")
  const [intervalDays, setIntervalDays] = useState(2)
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [executionTime, setExecutionTime] = useState("08:00")
  const [startDate, setStartDate] = useState("")
  const [totalWeeks, setTotalWeeks] = useState<number | "">("")
  const [executionMode, setExecutionMode] = useState<ScheduleExecutionMode>("sequential")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && schedule) {
      setFrequencyType(schedule.frequency_type)
      setIntervalDays(schedule.interval_days || 2)
      setWeekdays(schedule.weekdays || [])
      setExecutionTime((schedule.execution_time || "08:00").slice(0, 5))
      setStartDate((schedule.start_date || "").slice(0, 10))
      setTotalWeeks(schedule.total_weeks ?? "")
      setExecutionMode(schedule.execution_mode)
    }
  }, [open, schedule])

  const handleSave = async () => {
    if (!schedule) return
    if (frequencyType === "weekdays" && weekdays.length === 0) {
      toast.error("Selecione ao menos um dia da semana.")
      return
    }
    setSaving(true)
    try {
      await onSave(schedule.id, {
        frequency_type: frequencyType,
        interval_days: frequencyType === "interval" ? intervalDays : undefined,
        weekdays: frequencyType === "weekdays" ? weekdays : undefined,
        execution_time: executionTime,
        start_date: startDate,
        total_weeks: totalWeeks === "" ? null : Number(totalWeeks),
        execution_mode: executionMode,
      })
      toast.success("Agendamento atualizado.")
      onClose()
    } catch {
      toast.error("Erro ao atualizar agendamento.")
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
            Editar agendamento
          </DialogTitle>
          <DialogDescription>
            {schedule?.content_name
              ? `Ajuste a programação de "${schedule.content_name}".`
              : "Ajuste a programação desta mídia."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-schedule-time">Horário</Label>
              <Input
                id="edit-schedule-time"
                type="time"
                value={executionTime}
                onChange={(e) => setExecutionTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-schedule-start">Início</Label>
              <Input
                id="edit-schedule-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-schedule-weeks">Duração (semanas)</Label>
              <Input
                id="edit-schedule-weeks"
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button className="gap-2" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
