'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Settings } from 'lucide-react'

interface MetricsConfig {
  [key: string]: { label: string; visible: boolean }
}

interface MetricsVisibilityModalProps {
  visibleMetrics: MetricsConfig
  metricsConfig: MetricsConfig
  onMetricsChange: (metrics: MetricsConfig) => void
  onSaveView: (viewName: string) => void
  trigger?: React.ReactNode
  isSaving?: boolean
}

export function MetricsVisibilityModal({
  visibleMetrics,
  metricsConfig,
  onMetricsChange,
  onSaveView,
  trigger,
  isSaving = false,
}: MetricsVisibilityModalProps) {
  const [open, setOpen] = useState(false)
  const [viewName, setViewName] = useState('')

  const handleToggleMetric = (metricKey: string) => {
    onMetricsChange({
      ...visibleMetrics,
      [metricKey]: {
        ...visibleMetrics[metricKey],
        visible: !visibleMetrics[metricKey].visible,
      },
    })
  }

  const handleSave = () => {
    if (viewName.trim()) {
      onSaveView(viewName)
      setViewName('')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 bg-transparent">
            <Settings className="h-4 w-4" />
            Personalizar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Settings className="h-4 w-4" />
            Personalizar Visualização
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Selecione quais métricas deseja exibir na tabela
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* Metrics selection */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.entries(metricsConfig).map(([key, metric]) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  id={key}
                  checked={visibleMetrics[key]?.visible ?? true}
                  onCheckedChange={() => handleToggleMetric(key)}
                />
                <Label 
                  htmlFor={key}
                  className="font-medium cursor-pointer flex-1"
                >
                  {metric.label}
                </Label>
              </div>
            ))}
          </div>

          {/* View name input */}
          <div className="space-y-2">
            <Label htmlFor="viewName">Nome da Visualização</Label>
            <Input
              id="viewName"
              placeholder="Ex: Métricas Essenciais"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!viewName.trim() || isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? 'Salvando...' : 'Salvar Visualização'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
