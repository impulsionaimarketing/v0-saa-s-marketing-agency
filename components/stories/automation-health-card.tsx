"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, CheckCircle2, AlertTriangle, CalendarClock } from "lucide-react"
import type { StoryAutomationHealth } from "@/lib/types/stories"

export function AutomationHealthCard() {
  const [health, setHealth] = useState<StoryAutomationHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch("/api/stories/health")
        if (res.ok && active) {
          setHealth(await res.json())
        }
      } catch (err) {
        console.error("[v0] Error loading automation health:", err)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const metrics = [
    {
      label: "Automações ativas",
      value: health?.active_automations ?? 0,
      icon: Activity,
      tone: "text-primary",
    },
    {
      label: "Publicações hoje",
      value: health?.published_today ?? 0,
      icon: CheckCircle2,
      tone: "text-emerald-600",
    },
    {
      label: "Falhas hoje",
      value: health?.failed_today ?? 0,
      icon: AlertTriangle,
      tone: (health?.failed_today ?? 0) > 0 ? "text-destructive" : "text-muted-foreground",
    },
    {
      label: "Próximas execuções (24h)",
      value: health?.upcoming_24h ?? 0,
      icon: CalendarClock,
      tone: "text-foreground",
    },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Saúde da Automação
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-4"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <m.icon className={`h-4 w-4 ${m.tone}`} />
                  <span className="text-xs font-medium">{m.label}</span>
                </div>
                <span className={`text-2xl font-bold ${m.tone}`}>{m.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
