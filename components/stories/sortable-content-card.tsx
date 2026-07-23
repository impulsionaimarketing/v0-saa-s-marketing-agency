"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ContentCard } from "@/components/stories/content-card"
import type { StoryContent } from "@/lib/types/stories"

interface SortableContentCardProps {
  content: StoryContent
  selected: boolean
  onToggleSelect: (id: string, shiftKey: boolean) => void
  onEdit: (content: StoryContent) => void
  onSchedule: (content: StoryContent) => void
  onMove: (content: StoryContent) => void
  onDelete: (content: StoryContent) => void
}

// Envolve o ContentCard com a lógica de ordenação do @dnd-kit.
// O handle de arrastar (grip) recebe os listeners; o restante do card
// permanece clicável normalmente.
export function SortableContentCard(props: SortableContentCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.content.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ContentCard
        {...props}
        sortable
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}
