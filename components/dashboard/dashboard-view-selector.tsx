'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Save, Trash2, Star } from 'lucide-react'
import type { DashboardView } from '@/lib/types/dashboard'

interface DashboardViewSelectorProps {
  context: string
  views: DashboardView[]
  activeViewId?: string
  onViewSelect: (viewId: string) => void
  onDeleteView: (viewId: string) => void
  onSetDefault: (viewId: string) => void
}

export function DashboardViewSelector({
  context,
  views,
  activeViewId,
  onViewSelect,
  onDeleteView,
  onSetDefault,
}: DashboardViewSelectorProps) {
  const activeView = activeViewId ? views.find(v => v.id === activeViewId) : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Save className="h-4 w-4" />
          {activeView ? activeView.name : 'Visualizações'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Visualizações Salvas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {views.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            Nenhuma visualização salva
          </div>
        ) : (
          views.map((view) => (
            <div key={view.id} className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuItem 
                className="flex-1"
                onClick={() => onViewSelect(view.id)}
              >
                <div className="flex items-center gap-2">
                  {view.isDefault && <Star className="h-3 w-3 text-yellow-500" />}
                  <span>{view.name}</span>
                </div>
              </DropdownMenuItem>
              <div className="flex gap-1">
                {!view.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSetDefault(view.id)
                    }}
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteView(view.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
