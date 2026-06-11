"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Power, Images, Clock, CalendarClock } from "lucide-react"
import type { StorySummary } from "@/lib/types/stories"

function formatDateTime(value: string | null): string {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return "—"
  }
}

export function StorySummaryCards({
  summary,
  loading,
}: {
  summary: StorySummary | null
  loading: boolean
}) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: "Status da automação",
      icon: Power,
      value: (
        <Badge
          variant={summary.enabled ? "default" : "secondary"}
          className={summary.enabled ? "bg-primary text-primary-foreground" : ""}
        >
          {summary.enabled ? "Ativa" : "Inativa"}
        </Badge>
      ),
    },
    {
      label: "Mídias cadastradas",
      icon: Images,
      value: (
        <span className="text-2xl font-bold text-foreground">
          {summary.total_contents}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            ({summary.active_contents} ativas)
          </span>
        </span>
      ),
    },
    {
      label: "Última publicação",
      icon: Clock,
      value: (
        <span className="text-sm font-semibold text-foreground">
          {formatDateTime(summary.last_publication)}
        </span>
      ),
    },
    {
      label: "Próxima publicação",
      icon: CalendarClock,
      value: (
        <span className="text-sm font-semibold text-foreground">
          {formatDateTime(summary.next_publication)}
        </span>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="bg-card border-border">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <card.icon className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{card.label}</span>
            </div>
            <div className="flex min-h-8 items-center">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
