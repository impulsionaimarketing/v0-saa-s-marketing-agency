"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Video,
  Image as ImageIcon,
  Instagram,
  Upload,
  Pencil,
  CalendarClock,
  FolderInput,
  Trash2,
  Folder,
} from "lucide-react"
import { SCHEDULE_STATUS_LABELS, type StoryContent } from "@/lib/types/stories"

function formatDateTime(value?: string | null): string {
  if (!value) return ""
  try {
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}

const STATUS_TONE: Record<string, string> = {
  scheduled: "bg-primary/15 text-primary",
  paused: "bg-muted text-muted-foreground",
  published: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  failed: "bg-destructive/15 text-destructive",
}

interface ContentCardProps {
  content: StoryContent
  selected: boolean
  onToggleSelect: (id: string, shiftKey: boolean) => void
  onEdit: (content: StoryContent) => void
  onSchedule: (content: StoryContent) => void
  onMove: (content: StoryContent) => void
  onDelete: (content: StoryContent) => void
}

export function ContentCard({
  content,
  selected,
  onToggleSelect,
  onEdit,
  onSchedule,
  onMove,
  onDelete,
}: ContentCardProps) {
  const title = content.name || content.caption || "Sem nome"
  const inFolder = Boolean(content.folder_id)
  // Agendamento individual só vale para mídias "Sem pasta". Mídias em pasta
  // são publicadas pela automação da própria pasta.
  const status = inFolder ? undefined : content.schedule?.status
  const nextExecution = inFolder ? null : content.schedule?.next_execution

  return (
    <Card
      className={`group relative overflow-hidden bg-card transition-all ${
        selected ? "ring-2 ring-primary" : "hover:shadow-md"
      } ${content.is_active ? "" : "opacity-60"}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/5] bg-muted">
        {content.thumbnail_url || content.file_url ? (
          <Image
            src={content.thumbnail_url || content.file_url || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover"
            crossOrigin="anonymous"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Checkbox de seleção */}
        <div
          className={`absolute left-2 top-2 rounded-md bg-background/80 p-0.5 backdrop-blur transition-opacity ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <Checkbox
            checked={selected}
            onClick={(e) => onToggleSelect(content.id, (e as React.MouseEvent).shiftKey)}
            aria-label={`Selecionar ${title}`}
          />
        </div>

        {/* Tipo */}
        <div className="absolute right-2 top-2">
          <Badge variant="secondary" className="gap-1 bg-background/85">
            {content.type === "video" ? (
              <Video className="h-3 w-3" />
            ) : (
              <ImageIcon className="h-3 w-3" />
            )}
            {content.type === "video" ? "Vídeo" : "Imagem"}
          </Badge>
        </div>

        {/* Origem */}
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="gap-1 bg-background/85">
            {content.source === "instagram" ? (
              <>
                <Instagram className="h-3 w-3" /> Instagram
              </>
            ) : (
              <>
                <Upload className="h-3 w-3" /> Upload
              </>
            )}
          </Badge>
        </div>

        {/* Ações ao passar o mouse */}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-1 bg-background/90 p-2 backdrop-blur transition-transform group-hover:translate-y-0">
          <HoverAction label="Editar" onClick={() => onEdit(content)}>
            <Pencil className="h-4 w-4" />
          </HoverAction>
          {!inFolder && (
            <HoverAction label="Programar" onClick={() => onSchedule(content)}>
              <CalendarClock className="h-4 w-4" />
            </HoverAction>
          )}
          <HoverAction label="Mover" onClick={() => onMove(content)}>
            <FolderInput className="h-4 w-4" />
          </HoverAction>
          <HoverAction label="Excluir" destructive onClick={() => onDelete(content)}>
            <Trash2 className="h-4 w-4" />
          </HoverAction>
        </div>
      </div>

      {/* Metadados */}
      <div className="space-y-2 p-3">
        <p className="line-clamp-1 text-sm font-medium text-foreground" title={title}>
          {title}
        </p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Folder className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{content.folder_name || "Sem pasta"}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="secondary"
            className={`text-[11px] font-medium ${
              inFolder
                ? "bg-primary/15 text-primary"
                : status
                  ? STATUS_TONE[status]
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {inFolder
              ? "Publicação pela pasta"
              : status
                ? SCHEDULE_STATUS_LABELS[status]
                : "Sem agendamento"}
          </Badge>
          {nextExecution && (
            <span className="line-clamp-1 text-[11px] text-muted-foreground">
              {formatDateTime(nextExecution)}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

function HoverAction({
  label,
  children,
  onClick,
  destructive,
}: {
  label: string
  children: React.ReactNode
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${destructive ? "text-destructive hover:text-destructive" : ""}`}
          onClick={onClick}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
