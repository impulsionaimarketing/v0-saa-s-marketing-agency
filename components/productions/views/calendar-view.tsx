'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Video, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Production {
  id: string
  client_id: string
  client_name?: string
  type: 'Vídeo' | 'Arte'
  responsible_id?: string
  responsible_name?: string
  status: string
  post_date?: string
  notes?: string
  demand_id?: string
  created_at: string
  title?: string
  priority?: string
  script?: string
  description?: string
  reference_url?: string
  media_url?: string
  final_url?: string
}

interface CalendarViewProps {
  productions: Production[]
  onSelect: (production: Production) => void
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const STATUS_COLORS: Record<string, string> = {
  'Planejamento': 'bg-amber-500',
  'Produção': 'bg-violet-500',
  'Aprovação do Cliente': 'bg-blue-500',
  'Solicitou Ajuste': 'bg-orange-500',
  'Aprovado': 'bg-emerald-500',
  'Programado': 'bg-slate-500',
  'Publicado': 'bg-green-500',
}

function getStatusColor(status: string) {
  return STATUS_COLORS[status] || 'bg-muted'
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function CalendarCell({ 
  day, 
  isCurrentMonth, 
  isToday, 
  productions, 
  onSelect 
}: { 
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  productions: Production[]
  onSelect: (p: Production) => void
}) {
  return (
    <div
      className={cn(
        'min-h-28 p-1.5 border-b border-r border-border transition-colors',
        !isCurrentMonth && 'bg-muted/30',
        isToday && 'bg-primary/5'
      )}
    >
      <div className={cn(
        'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
        isToday && 'bg-primary text-primary-foreground',
        !isCurrentMonth && 'text-muted-foreground'
      )}>
        {day}
      </div>
      
      <div className="space-y-1">
        {productions.slice(0, 3).map((production) => (
          <button
            key={production.id}
            onClick={() => onSelect(production)}
            className={cn(
              'w-full text-left px-1.5 py-1 rounded text-[10px] font-medium truncate transition-opacity hover:opacity-80',
              getStatusColor(production.status),
              'text-white'
            )}
          >
            <span className="flex items-center gap-1">
              {production.type === 'Vídeo' ? (
                <Video className="w-2.5 h-2.5 flex-shrink-0" />
              ) : (
                <ImageIcon className="w-2.5 h-2.5 flex-shrink-0" />
              )}
              <span className="truncate">{production.title || production.notes || 'Sem título'}</span>
            </span>
          </button>
        ))}
        {productions.length > 3 && (
          <p className="text-[10px] text-muted-foreground px-1.5">
            +{productions.length - 3} mais
          </p>
        )}
      </div>
    </div>
  )
}

export function CalendarView({ productions, onSelect }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const daysInPrevMonth = getDaysInMonth(year, month - 1)
  
  const today = new Date()
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getProductionsForDay = (day: number, isCurrentMonthDay: boolean) => {
    if (!isCurrentMonthDay) return []
    
    return productions.filter(p => {
      if (!p.post_date) return false
      const postDate = new Date(p.post_date)
      return postDate.getDate() === day && 
             postDate.getMonth() === month && 
             postDate.getFullYear() === year
    })
  }

  // Generate calendar days
  const calendarDays: { day: number; isCurrentMonth: boolean; isToday: boolean }[] = []
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: false
    })
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      isToday: isCurrentMonth && today.getDate() === i
    })
  }
  
  // Next month days
  const remainingDays = 42 - calendarDays.length
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      isToday: false
    })
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {MONTHS[month]} {year}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday} className="h-7 text-xs">
            Hoje
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground border-r border-border last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((dayInfo, index) => (
          <CalendarCell
            key={index}
            day={dayInfo.day}
            isCurrentMonth={dayInfo.isCurrentMonth}
            isToday={dayInfo.isToday}
            productions={getProductionsForDay(dayInfo.day, dayInfo.isCurrentMonth)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
