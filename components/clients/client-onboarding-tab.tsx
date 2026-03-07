'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { toggleOnboardingTask, getOnboardingTasks, type OnboardingTask } from '@/lib/data/client-details'
import { cn } from '@/lib/utils'

interface ClientOnboardingTabProps {
  clientId: string
}

export function ClientOnboardingTab({ clientId }: ClientOnboardingTabProps) {
  const [tasks, setTasks] = useState<OnboardingTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTasks()
  }, [clientId])

  const loadTasks = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getOnboardingTasks(clientId)
      setTasks(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar tarefas'
      setError(message)
      console.error('[v0] Error loading tasks:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await toggleOnboardingTask(taskId, !completed)
      // Update local state
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: !completed } : task
        )
      )
    } catch (err) {
      console.error('[v0] Error toggling task:', err)
    }
  }

  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="pt-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Progresso do Onboarding</CardTitle>
            <Badge className="text-lg px-3 py-1" variant="outline">
              {completionPercentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Progress bar */}
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            {/* Count */}
            <p className="text-sm text-muted-foreground">
              {completedCount} de {totalCount} tarefas concluídas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nenhuma tarefa de onboarding configurada
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className={cn('bg-card border-border transition-opacity', task.completed && 'opacity-60')}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    id={task.id}
                    checked={task.completed}
                    onCheckedChange={() => handleToggleTask(task.id, task.completed)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={task.id}
                      className={cn(
                        'text-base font-medium cursor-pointer',
                        task.completed && 'line-through text-muted-foreground'
                      )}
                    >
                      {task.title}
                    </Label>
                    {task.completed && task.completed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Concluída em {new Date(task.completed_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
