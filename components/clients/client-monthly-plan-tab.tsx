'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthlyPlan, saveMonthlyPlan, type MonthlyPlan } from '@/lib/data/client-details'
import { Textarea } from '@/components/ui/textarea'

interface ClientMonthlyPlanTabProps {
  clientId: string
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function ClientMonthlyPlanTab({ clientId }: ClientMonthlyPlanTabProps) {
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear())
  const [plan, setPlan] = useState<MonthlyPlan | null>(null)
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    loadPlan()
  }, [clientId, currentMonth, currentYear])

  const loadPlan = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getMonthlyPlan(clientId, currentMonth + 1, currentYear)
      setPlan(data)
      setContent(data?.content || '')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar plano'
      setError(message)
      console.error('[v0] Error loading plan:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      await saveMonthlyPlan(clientId, currentMonth + 1, currentYear, content)
      setLastSaved(new Date())
      // Reload to get updated data
      await loadPlan()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar plano'
      setError(message)
      console.error('[v0] Error saving plan:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleToday = () => {
    const now = new Date()
    setCurrentMonth(now.getMonth())
    setCurrentYear(now.getFullYear())
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {MONTHS[currentMonth]} de {currentYear}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                className="h-8 w-8 p-0 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-8 px-2 text-xs bg-transparent"
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="h-8 w-8 p-0 bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error message */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Planejamento</CardTitle>
            {lastSaved && (
              <Badge variant="outline" className="text-xs">
                Salvo em {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite o planejamento para o mês..."
            className="min-h-64 resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
