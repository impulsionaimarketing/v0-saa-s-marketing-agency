"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Loader2, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  WEEKDAY_LABELS,
  type StoryAutomation,
  type StoryFolder,
  type StoryPublishMode,
  type StoryFrequencyType,
  type UpsertStoryAutomationInput,
} from "@/lib/types/stories"

export type FolderAutomationConfig = Omit<UpsertStoryAutomationInput, "company_id" | "folder_id">

interface ScheduleFolderDialogProps {
  folder: StoryFolder | null
  automation: StoryAutomation | null
  open: boolean
  onClose: () => void
  onSave: (folderId: string, config: FolderAutomationConfig) => Promise<unknown>
  onRemove: (folderId: string) => Promise<unknown>
}

export function ScheduleFolderDialog({
  folder,
  automation,
  open,
  onClose,
  onSave,
  onRemove,
}: ScheduleFolderDialogProps) {
  const [enabled, setEnabled] = useState(true)
  const [publishMode, setPublishMode] = useState<StoryPublishMode>("random")
  const [frequencyType, setFrequencyType] = useState<StoryFrequencyType>("daily")
  const [frequencyValue, setFrequencyValue] = useState(1)
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [executionTime, setExecutionTime] = useState("08:00")
  const [dailyLimit, setDailyLimit] = useState(1)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  // Sincroniza os campos com a automação da pasta sempre que o diálogo abre.
  useEffect(() => {
    if (!open) return
    if (automation) {
      setEnabled(automation.enabled)
      setPublishMode(automation.publish_mode)
      setFrequencyType(automation.frequency_type)
      setFrequencyValue(automation.frequency_value || 1)
      setWeekdays(automation.weekdays || [])
      setExecutionTime((automation.execution_time || "08:00").slice(0, 5))
      setDailyLimit(automation.daily_limit || 1)
    } else {
      // Nova programação: valores padrão sensatos.
      setEnabled(true)
      setPublishMode("random")
      setFrequencyType("daily")
      setFrequencyValue(1)
      setWeekdays([])
      setExecutionTime("08:00")
      setDailyLimit(1)
    }
  }, [open, automation])

  const handleSave = async () => {
    if (!folder) return
    setSaving(true)
    try {
      await onSave(folder.id, {
        enabled,
        publish_mode: publishMode,
        frequency_type: frequencyType,
        frequency_value: frequencyValue,
        weekdays,
        execution_time: executionTime,
        daily_limit: dailyLimit,
      })
      toast.success("Programação da pasta salva.")
      onClose()
    } catch {
      toast.error("Erro ao salvar a programação da pasta.")
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!folder) return
    setRemoving(true)
    try {
      await onRemove(folder.id)
      toast.success("Programação removida.")
      onClose()
    } catch {
      toast.error("Erro ao remover a programação.")
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Programar pasta</DialogTitle>
          <DialogDescription>
            {folder
              ? `As mídias da pasta "${folder.name}" serão publicadas automaticamente conforme as regras abaixo.`
              : "Configure a publicação automática desta pasta."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Ativar */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="pr-4">
              <Label className="text-sm">Automação ativa</Label>
              <p className="text-xs text-muted-foreground">
                Desative para pausar as publicações desta pasta sem perder as regras.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* Tipo de publicação */}
          <div className="space-y-2">
            <Label>Tipo de publicação</Label>
            <Select value={publishMode} onValueChange={(v) => setPublishMode(v as StoryPublishMode)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Aleatória</SelectItem>
                <SelectItem value="sequential">Sequencial</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {publishMode === "random"
                ? "Escolhe uma mídia ativa da pasta aleatoriamente a cada publicação."
                : "Publica as mídias ativas da pasta em ordem de cadastro."}
            </p>
          </div>

          {/* Frequência */}
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select
              value={frequencyType}
              onValueChange={(v) => setFrequencyType(v as StoryFrequencyType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Todos os dias</SelectItem>
                <SelectItem value="interval">A cada X dias</SelectItem>
                <SelectItem value="weekdays">Dias específicos da semana</SelectItem>
              </SelectContent>
            </Select>

            {frequencyType === "interval" && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-muted-foreground">A cada</span>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={frequencyValue}
                  onChange={(e) => setFrequencyValue(Math.max(1, Number(e.target.value)))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">dia(s)</span>
              </div>
            )}

            {frequencyType === "weekdays" && (
              <div className="pt-2">
                <ToggleGroup
                  type="multiple"
                  value={weekdays.map(String)}
                  onValueChange={(vals) => setWeekdays(vals.map(Number).sort())}
                  className="flex flex-wrap justify-start gap-2"
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
              </div>
            )}
          </div>

          {/* Horário + limite diário */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="folder-execution-time">Horário</Label>
              <Input
                id="folder-execution-time"
                type="time"
                value={executionTime}
                onChange={(e) => setExecutionTime(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder-daily-limit">Limite diário</Label>
              <Input
                id="folder-daily-limit"
                type="number"
                min={1}
                max={10}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Math.max(1, Number(e.target.value)))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{dailyLimit} story(ies) por dia</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {automation ? (
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={saving || removing}
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Remover programação
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving || removing}>
              Cancelar
            </Button>
            <Button className="gap-2" onClick={handleSave} disabled={saving || removing}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
