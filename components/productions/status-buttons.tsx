'use client'

import { Button } from '@/components/ui/button'
import { Production } from '@/lib/data/productions'

interface StatusButtonsProps {
  currentStatus: string
  onStatusChange: (status: string) => void
  isUpdating: boolean
}

const STATUS_BUTTONS = [
  { status: 'Planejamento', emoji: '🟡', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { status: 'Aprovação do Cliente', emoji: '🔵', color: 'bg-blue-500 hover:bg-blue-600' },
  { status: 'Captação', emoji: '🟠', color: 'bg-orange-500 hover:bg-orange-600' },
  { status: 'Edição', emoji: '🟣', color: 'bg-purple-500 hover:bg-purple-600' },
  { status: 'Revisão', emoji: '🔴', color: 'bg-red-500 hover:bg-red-600' },
  { status: 'Legenda', emoji: '🟢', color: 'bg-green-500 hover:bg-green-600' },
  { status: 'Programado', emoji: '⚫', color: 'bg-gray-800 hover:bg-gray-900' },
  { status: 'Publicado', emoji: '✅', color: 'bg-emerald-500 hover:bg-emerald-600' },
]

export function StatusButtons({ currentStatus, onStatusChange, isUpdating }: StatusButtonsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Mudar para:
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STATUS_BUTTONS.map((btn) => {
          const isCurrent = btn.status === currentStatus
          return (
            <Button
              key={btn.status}
              onClick={() => onStatusChange(btn.status)}
              disabled={isUpdating || isCurrent}
              className={`
                h-12 text-xs font-semibold rounded-xl text-white
                ${btn.color}
                ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-400 opacity-70' : ''}
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
              `}
            >
              <span className="mr-1">{btn.emoji}</span>
              <span className="truncate">{btn.status}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}