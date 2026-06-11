"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import {
  WEEKDAY_LABELS,
  type StoryAutomation,
  type StoryPublishMode,
  type StoryFrequencyType,
  type UpsertStoryAutomationInput,
} from "@/lib/types/stories"

interface AutomationTabProps {
  automation: StoryAutomation | null
  loading: boolean
  onSave: (input: Omit<UpsertStoryAutomationInput, "company_id">) => Promise<unknown>
}

export function AutomationTab({ automation, loading, onSave }: AutomationTabProps) {
  const [enabled, setEnabled] = useState(false)
  const [publishMode, setPublishMode] = useState<StoryPublishMode>("random")
  const [frequencyType, setFrequencyType] = useState<StoryFrequencyType>("daily")
  const [frequencyValue, setFrequencyValue] = useState(1)
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [executionTime, setExecutionTime] = useState("08:00")
  const [dailyLimit, setDailyLimit] = useState(1)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (automation) {
      setEnabled(automation.enabled)
      setPublishMode(automation.publish_mode)
      setFrequencyType(automation.frequency_type)
      setFrequencyValue(automation.frequency_value || 1)
      setWeekdays(automation.weekdays || [])
      setExecutionTime((automation.execution_time || "08:00").slice(0, 5))
      setDailyLimit(automation.daily_limit || 1)
    }
  }, [automation])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        enabled,
        publish_mode: publishMode,
        frequency_type: frequencyType,
        frequency_value: frequencyValue,
        weekdays,
        execution_time: executionTime,
        daily_limit: dailyLimit,
      })
      toast.success("Automação salva com sucesso.")
    } catch {
      toast.error("Erro ao salvar automação.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-card">
        <CardContent className="space-y-4 p-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status */}
      <Card className="bg-card">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <Label className="text-base">Ativar Automação</Label>
            <p className="text-sm text-muted-foreground">
              Quando ativa, os stories serão publicados automaticamente conforme as regras abaixo.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">Regras de publicação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de publicação */}
          <div className="space-y-2">
            <Label>Tipo de Publicação</Label>
            <Select
              value={publishMode}
              onValueChange={(v) => setPublishMode(v as StoryPublishMode)}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Aleatória</SelectItem>
                <SelectItem value="sequential">Sequencial</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {publishMode === "random"
                ? "Escolhe um conteúdo ativo aleatoriamente a cada publicação."
                : "Publica os conteúdos ativos em ordem de cadastro."}
            </p>
          </div>

          {/* Frequência */}
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select
              value={frequencyType}
              onValueChange={(v) => setFrequencyType(v as StoryFrequencyType)}
            >
              <SelectTrigger className="w-full sm:w-64">
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
              <Label htmlFor="execution-time">Horário</Label>
              <Input
                id="execution-time"
                type="time"
                value={executionTime}
                onChange={(e) => setExecutionTime(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily-limit">Limite Diário</Label>
              <Input
                id="daily-limit"
                type="number"
                min={1}
                max={10}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Math.max(1, Number(e.target.value)))}
                className="w-full sm:w-40"
              />
              <p className="text-xs text-muted-foreground">
                {dailyLimit} story(ies) por dia
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar configuração
        </Button>
      </div>
    </div>
  )
}
