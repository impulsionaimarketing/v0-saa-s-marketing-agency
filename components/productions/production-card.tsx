'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MediaPreview } from './media-preview'
import { QuickInfo } from './quick-info'
import { StatusPipeline } from './status-pipeline'
import { ActionButtons } from './action-buttons'
import { HistoryList } from './history-list'
import { Production } from '@/lib/data/productions'
import { useAuth } from '@/lib/hooks/use-auth'

interface ProductionCardProps {
  production: Production
  onUpdateStatus: (id: string, newStatus: string) => Promise<void>
  isLoading?: boolean
}

const STATUS_COLORS = {
  'Planejamento': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Aprovação do Cliente': 'bg-blue-100 text-blue-800 border-blue-200',
  'Captação': 'bg-orange-100 text-orange-800 border-orange-200',
  'Edição': 'bg-purple-100 text-purple-800 border-purple-200',
  'Revisão': 'bg-red-100 text-red-800 border-red-200',
  'Legenda': 'bg-green-100 text-green-800 border-green-200',
  'Programado': 'bg-gray-100 text-gray-800 border-gray-200',
  'Publicado': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Em Tráfego': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Finalizado': 'bg-slate-100 text-slate-800 border-slate-200',
}

const STATUS_ORDER = [
  'Planejamento',
  'Aprovação do Cliente',
  'Captação',
  'Edição',
  'Revisão',
  'Legenda',
  'Programado',
  'Publicado',
  'Em Tráfego',
  'Finalizado'
]

const PRIORITY_COLORS = {
  'Alta': 'bg-red-500',
  'Média': 'bg-yellow-500',
  'Baixa': 'bg-green-500',
}

export function ProductionCard({ production, onUpdateStatus, isLoading }: ProductionCardProps) {
  const { user } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (isUpdating) return
    
    setIsUpdating(true)
    try {
      await onUpdateStatus(production.id, newStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  const currentStatusIndex = STATUS_ORDER.indexOf(production.status)
  const nextStatus = STATUS_ORDER[currentStatusIndex + 1]

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* 1. Mídia no topo */}
      <MediaPreview production={production} />
      
      <CardContent className="p-4 space-y-4">
        {/* 2. Informações rápidas */}
        <QuickInfo production={production} />
        
        {/* 3. Status visual */}
        <StatusPipeline 
          currentStatus={production.status}
          statusOrder={STATUS_ORDER}
          statusColors={STATUS_COLORS}
        />
        
        {/* 4. Botões operacionais */}
        <ActionButtons
          currentStatus={production.status}
          nextStatus={nextStatus}
          onStatusChange={handleStatusChange}
          isUpdating={isUpdating}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          user={user}
        />
        
        {/* 5. Histórico */}
        {showHistory && (
          <HistoryList productionId={production.id} />
        )}
      </CardContent>
    </Card>
  )
}

// Skeleton para carregamento
export function ProductionCardSkeleton() {
  return (
    <Card className="w-full max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Media preview skeleton */}
      <div className="aspect-video bg-gray-100 relative">
        <Skeleton className="w-full h-full" />
      </div>
      
      <CardContent className="p-4 space-y-4">
        {/* Quick info skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        
        {/* Status pipeline skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-16 rounded-full" />
            ))}
          </div>
        </div>
        
        {/* Action buttons skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}