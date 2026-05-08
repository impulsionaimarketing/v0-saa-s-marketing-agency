'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, ArrowRight } from 'lucide-react'

interface HistoryItem {
  id: string
  old_status: string
  new_status: string
  changed_by: string
  changed_at: string
}

interface HistoryListProps {
  productionId: string
}

export function HistoryList({ productionId }: HistoryListProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [productionId])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/productions/${productionId}/history`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-50 rounded-xl border-gray-100">
        <CardContent className="p-3 space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card className="bg-gray-50 rounded-xl border-gray-100">
        <CardContent className="p-3">
          <p className="text-xs text-gray-400 text-center">Nenhum histórico disponível</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-50 rounded-xl border-gray-100">
      <CardContent className="p-3 space-y-2">
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Histórico
        </p>
        
        {history.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-xs">
            <span className="text-gray-600 flex-1 truncate">
              {item.changed_by}
            </span>
            <span className="flex items-center gap-1 text-gray-500 flex-shrink-0">
              <span className="font-medium">{item.old_status}</span>
              <ArrowRight className="w-3 h-3" />
              <span className="font-medium">{item.new_status}</span>
            </span>
            <span className="text-gray-400 flex-shrink-0 text-[10px]">
              {new Date(item.changed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}