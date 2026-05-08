'use client'

import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { User } from '@/lib/contexts/auth-context'

interface ActionButtonsProps {
  currentStatus: string
  nextStatus: string | undefined
  onStatusChange: (status: string) => Promise<void>
  isUpdating: boolean
  showHistory: boolean
  setShowHistory: (show: boolean) => void
  user: User | null
}

const STATUS_ACTION_LABELS: Record<string, string> = {
  'Planejamento': '🟡 Planejamento',
  'Aprovação do Cliente': '🔵 Aprovação Cliente',
  'Captação': '🟠 Captação',
  'Edição': '🟣 Edição',
  'Revisão': '🔴 Revisão',
  'Legenda': '🟢 Legenda',
  'Programado': '⚫ Programado',
  'Publicado': '✅ Publicado',
}

export function ActionButtons({ 
  currentStatus, 
  nextStatus, 
  onStatusChange, 
  isUpdating,
  showHistory,
  setShowHistory,
  user 
}: ActionButtonsProps) {
  const handleNextStatus = () => {
    if (nextStatus) {
      onStatusChange(nextStatus)
    }
  }

  return (
    <div className="space-y-2">
      {/* Botão de avançar status */}
      {nextStatus && (
        <Button
          onClick={handleNextStatus}
          disabled={isUpdating}
          className="w-full h-12 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isUpdating ? (
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 animate-spin" />
              Atualizando...
            </span>
          ) : (
            <span>
              {STATUS_ACTION_LABELS[nextStatus] || nextStatus}
            </span>
          )}
        </Button>
      )}
      
      {/* Botão de ver histórico */}
      <Button
        variant="outline"
        onClick={() => setShowHistory(!showHistory)}
        className="w-full h-10 text-xs font-medium rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
      >
        <Clock className="w-3 h-3 mr-1" />
        {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
        {showHistory ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
      </Button>
      
      {/* Info de quem mudou */}
      {user && (
        <p className="text-[10px] text-gray-400 text-center">
          Última atualização por {user.name}
        </p>
      )}
    </div>
  )
}