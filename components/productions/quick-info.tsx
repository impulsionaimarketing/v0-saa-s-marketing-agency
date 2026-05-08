'use client'

import { Production } from '@/lib/data/productions'
import { Badge } from '@/components/ui/badge'
import { User, Calendar, AlertCircle } from 'lucide-react'

interface QuickInfoProps {
  production: Production
}

const PRIORITY_CONFIG = {
  'Alta': { color: 'bg-red-500', label: 'Alta' },
  'Média': { color: 'bg-yellow-500', label: 'Média' },
  'Baixa': { color: 'bg-green-500', label: 'Baixa' },
}

export function QuickInfo({ production }: QuickInfoProps) {
  const priority = PRIORITY_CONFIG[production.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG['Média']

  return (
    <div className="space-y-2">
      {/* Nome do conteúdo */}
      <h3 className="text-lg font-semibold text-gray-900 leading-tight">
        {production.title}
      </h3>
      
      <div className="flex flex-wrap gap-2 text-xs">
        {/* Cliente */}
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
          <User className="w-3 h-3" />
          {production.clientName}
        </span>
        
        {/* Responsável */}
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md font-medium">
          {production.responsible}
        </span>
        
        {/* Prazo */}
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-700 rounded-md font-medium">
          <Calendar className="w-3 h-3" />
          {new Date(production.postDate).toLocaleDateString('pt-BR')}
        </span>
        
        {/* Prioridade */}
        <Badge className={`${priority.color} text-white border-0 px-2 py-0.5 text-xs`}>
          <AlertCircle className="w-3 h-3 mr-1" />
          {priority.label}
        </Badge>
      </div>
    </div>
  )
}