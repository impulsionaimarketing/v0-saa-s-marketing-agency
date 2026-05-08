'use client'

import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

interface StatusPipelineProps {
  currentStatus: string
  statusOrder: string[]
  statusColors: Record<string, string>
}

export function StatusPipeline({ currentStatus, statusOrder, statusColors }: StatusPipelineProps) {
  const currentIdx = statusOrder.indexOf(currentStatus)

  return (
    <div className="space-y-3">
      {/* Label */}
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Pipeline de Produção
      </p>
      
      {/* Pipeline horizontal */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {statusOrder.map((status, idx) => {
          const isCurrent = status === currentStatus
          const isPast = idx < currentIdx
          const colorClass = statusColors[status] || 'bg-gray-100 text-gray-600 border-gray-200'

          return (
            <div key={status} className="flex items-center gap-1 flex-shrink-0">
              <Badge
                className={`
                  text-[10px] font-medium px-2 py-1 rounded-full border whitespace-nowrap
                  ${isCurrent ? 'ring-2 ring-offset-1 ring-blue-400 scale-105' : ''}
                  ${isPast ? 'opacity-60' : ''}
                  ${colorClass}
                `}
              >
                {isPast && <Check className="w-2.5 h-2.5 mr-0.5" />}
                {status}
              </Badge>
              
              {idx < statusOrder.length - 1 && (
                <div className={`w-3 h-0.5 flex-shrink-0 ${isPast ? 'bg-blue-400' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}