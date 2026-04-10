"use client"

import { useState, Suspense } from 'react'
import { LayoutGrid, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DemandsKanban } from '@/components/demands/demands-kanban'
import { DemandsChecklist } from '@/components/demands/demands-checklist'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type ViewMode = 'kanban' | 'checklist'

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-72">
          <Skeleton className="h-6 w-24 mb-3" />
          <div className="space-y-3 min-h-[400px] rounded-lg bg-secondary/30 p-2">
            {[...Array(3)].map((_, j) => (
              <Skeleton key={j} className="h-32 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ChecklistSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-14 w-full rounded-lg" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
          <div className="border-t border-border">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center gap-3 p-4 border-b border-border/50 last:border-b-0">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function DemandsViewToggle() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')

  return (
    <div className="space-y-4">
      {/* View toggle buttons */}
      <div className="flex items-center justify-end">
        <TooltipProvider>
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="h-8 px-3"
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Kanban
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Visualização em colunas por status</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'checklist' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('checklist')}
                  className="h-8 px-3"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Checklist
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Visualização em lista agrupada por cliente</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* View content */}
      {viewMode === 'kanban' ? (
        <Suspense fallback={<KanbanSkeleton />}>
          <DemandsKanban />
        </Suspense>
      ) : (
        <Suspense fallback={<ChecklistSkeleton />}>
          <DemandsChecklist />
        </Suspense>
      )}
    </div>
  )
}
