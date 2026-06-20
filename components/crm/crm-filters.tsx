'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type CRMTag, type LeadPriority, PRIORITY_CONFIG } from '@/lib/data/crm'

interface CRMFiltersProps {
  tags: CRMTag[]
  filterTagIds: string[]
  filterPriority: string | null
  onTagsChange: (tagIds: string[]) => void
  onPriorityChange: (priority: string | null) => void
}

export function CRMFilters({
  tags,
  filterTagIds,
  filterPriority,
  onTagsChange,
  onPriorityChange,
}: CRMFiltersProps) {
  const activeFiltersCount = filterTagIds.length + (filterPriority ? 1 : 0)

  const toggleTag = (tagId: string) => {
    if (filterTagIds.includes(tagId)) {
      onTagsChange(filterTagIds.filter(id => id !== tagId))
    } else {
      onTagsChange([...filterTagIds, tagId])
    }
  }

  const clearFilters = () => {
    onTagsChange([])
    onPriorityChange(null)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge 
              variant="default" 
              className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px]" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filtros</h4>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={clearFilters}
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Prioridade</Label>
            <div className="flex flex-wrap gap-1">
              {(Object.entries(PRIORITY_CONFIG) as [LeadPriority, { label: string; color: string }][]).map(([key, config]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-7 text-xs',
                    filterPriority === key && 'border-primary bg-primary/10'
                  )}
                  onClick={() => onPriorityChange(filterPriority === key ? null : key)}
                >
                  {config.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tags Filter */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tags</Label>
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma tag disponível.</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={filterTagIds.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                    />
                    <label
                      htmlFor={`tag-${tag.id}`}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
