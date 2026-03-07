'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface OnboardingTask {
  id: string
  title: string
  completed: boolean
  completed_at?: string | null
  order: number
}

interface Client {
  id: string
  name: string
  type: string
}

export default function ClientOnboardingPage() {
  const params = useParams()
  const clientName = params.clientName as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [tasks, setTasks] = useState<OnboardingTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadClientData() {
      try {
        setIsLoading(true)
        setError(null)

        // Load client data
        const clientResponse = await fetch(`/api/clients/search?name=${encodeURIComponent(clientName)}`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!clientResponse.ok) {
          throw new Error('Cliente não encontrado')
        }

        const clientData = await clientResponse.json()
        setClient(clientData)

        // Load onboarding tasks using client name
        const tasksResponse = await fetch(`/api/clients/${encodeURIComponent(clientName)}/onboarding`, {
          cache: 'no-store'
        })

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          // Now the API returns { client, tasks }
          setClient(tasksData.client)
          setTasks(tasksData.tasks)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar dados'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    if (clientName) {
      loadClientData()
    }
  }, [clientName])

  async function toggleTask(taskId: string, completed: boolean) {
    try {
      console.log('[v0] Toggling task:', taskId, 'completed:', completed)
      const response = await fetch(`/api/clients/${encodeURIComponent(clientName)}/onboarding/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed })
      })

      console.log('[v0] Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('[v0] API error:', response.status, errorData)
        throw new Error('Erro ao atualizar tarefa')
      }

      const updatedTask = await response.json()
      console.log('[v0] Task updated:', updatedTask)
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t))
    } catch (err) {
      console.error('[v0] Error toggling task:', err)
    }
  }

  const completedCount = tasks.filter(t => t.completed).length
  const totalTasks = tasks.length
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/onboarding">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{client?.name || 'Carregando...'}</h1>
              <p className="text-muted-foreground">{client?.type}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-base">
            {completionPercentage}% Concluído
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Progress Bar */}
            <Card>
              <CardHeader>
                <CardTitle>Progresso do Onboarding</CardTitle>
                <CardDescription>{completedCount} de {totalTasks} tarefas concluídas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tasks List */}
            <Card>
              <CardHeader>
                <CardTitle>Checklist de Onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.length === 0 ? (
                    <p className="text-muted-foreground">Nenhuma tarefa disponível</p>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={(checked) => toggleTask(task.id, !!checked)}
                          className="h-5 w-5"
                        />
                        <div className="flex-1">
                          <p className={task.completed ? 'line-through text-muted-foreground' : 'font-medium'}>
                            {task.title}
                          </p>
                          {task.completed_at && (
                            <p className="text-xs text-muted-foreground">
                              Concluído em {new Date(task.completed_at).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        {task.completed && <CheckCircle className="h-5 w-5 text-green-500" />}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
