"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { History, Video, Image as ImageIcon, Instagram, Upload } from "lucide-react"
import {
  STORY_STATUS_LABELS,
  type StoryPublicationHistory,
  type StoryPublicationStatus,
} from "@/lib/types/stories"

function formatDate(value: string | null): string {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

function formatTime(value: string | null): string {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return "—"
  }
}

const STATUS_STYLES: Record<StoryPublicationStatus, string> = {
  published: "bg-primary/10 text-primary border-primary/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  scheduled: "bg-muted text-muted-foreground border-border",
}

export function HistoryTab({
  history,
  loading,
}: {
  history: StoryPublicationHistory[]
  loading: boolean
}) {
  if (loading) {
    return (
      <Card className="bg-card">
        <CardContent className="space-y-3 p-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card className="border-dashed bg-card">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <History className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium text-foreground">Sem histórico ainda</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            As publicações realizadas pela automação aparecerão aqui.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => {
                const refDate = item.published_at || item.scheduled_for
                return (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(refDate)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatTime(refDate)}</TableCell>
                    <TableCell>
                      {item.content_thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.content_thumbnail_url || "/placeholder.svg"}
                          alt="Conteúdo publicado"
                          className="h-10 w-10 rounded object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        {item.content_type === "video" ? (
                          <Video className="h-3.5 w-3.5" />
                        ) : (
                          <ImageIcon className="h-3.5 w-3.5" />
                        )}
                        {item.content_type === "video" ? "Vídeo" : "Imagem"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        {item.content_source === "instagram" ? (
                          <>
                            <Instagram className="h-3.5 w-3.5" /> Instagram
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5" /> Upload
                          </>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_STYLES[item.status]}>
                        {STORY_STATUS_LABELS[item.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
