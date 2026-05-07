'use client'

import { useState, useEffect } from 'react'
import { type VideoScript } from '@/lib/data/video-scripts'
import { type User } from '@/lib/data/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Check, 
  Video,
  Calendar as CalendarIcon 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoScriptRowProps {
  video: VideoScript
  users: User[]
  onUpdate: (id: string, data: any) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onConvert: (id: string) => Promise<void>
}

const STATUS_OPTIONS = ['Não iniciado', 'Em progresso', 'Concluído']
const STATUS_COLORS: Record<string, string> = {
  'Não iniciado': 'bg-gray-100 text-gray-800',
  'Em progresso': 'bg-blue-100 text-blue-800',
  'Concluído': 'bg-green-100 text-green-800',
}

export function VideoScriptRow({
  video,
  users,
  onUpdate,
  onDelete,
  onConvert,
}: VideoScriptRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isPending, setIsPending] = useState(false)
  
  const [formData, setFormData] = useState({
    name: video.name,
    format: video.format || '',
    reference_links: video.reference_links || '',
    script_text: video.script_text || '',
    responsible_id: video.responsible_id || '',
    deadline: video.deadline || '',
    status: video.status || 'Não iniciado',
  })

  const [editingName, setEditingName] = useState(video.name)

  useEffect(() => {
    setFormData({
      name: video.name,
      format: video.format || '',
      reference_links: video.reference_links || '',
      script_text: video.script_text || '',
      responsible_id: video.responsible_id || '',
      deadline: video.deadline || '',
      status: video.status || 'Não iniciado',
    })
  }, [video])

  const handleSaveName = async () => {
    if (editingName && editingName !== video.name) {
      setIsPending(true)
      try {
        await onUpdate(video.id, { name: editingName })
      } finally {
        setIsPending(false)
      }
    }
    setIsEditingName(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    setIsPending(true)
    try {
      await onUpdate(video.id, { status: newStatus })
      setFormData(prev => ({ ...prev, status: newStatus }))
    } finally {
      setIsPending(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    try {
      await onUpdate(video.id, formData)
      setIsEditing(false)
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este roteiro?')) {
      setIsPending(true)
      try {
        await onDelete(video.id)
      } finally {
        setIsPending(false)
      }
    }
  }

  const handleConvert = async () => {
    setIsPending(true)
    try {
      await onConvert(video.id)
      setIsExpanded(false)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className={cn(
      'border rounded-lg transition-all',
      'border-l-4 border-l-blue-500',
      isExpanded ? 'border-border bg-muted/30' : 'border-border hover:bg-muted/20'
    )}>
      {/* Collapsed View */}
      <div className={cn(
        'flex items-center gap-3 p-4',
        isExpanded && 'border-b border-border'
      )}>
        <Video className="h-5 w-5 text-blue-500 shrink-0" />
        
        {/* Name - Inline Editable */}
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <input
              autoFocus
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName()
                if (e.key === 'Escape') {
                  setEditingName(video.name)
                  setIsEditingName(false)
                }
              }}
              className="px-2 py-1 border rounded text-sm font-medium max-w-xs truncate"
              disabled={isPending}
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-sm font-medium hover:text-primary transition-colors text-left max-w-xs truncate"
              title={formData.name}
            >
              {formData.name}
            </button>
          )}
        </div>

        {/* Status Badge - Clicável */}
        <Select value={formData.status} onValueChange={handleStatusChange} disabled={isPending}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {video.is_converted_to_demand && (
          <Badge variant="secondary" className="shrink-0">
            <Check className="h-3 w-3 mr-1" />
            Demanda
          </Badge>
        )}

        {/* Expand Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={isPending}
          className="shrink-0"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div>
            <Label htmlFor={`name-${video.id}`}>Nome do Vídeo *</Label>
            <Input
              id={`name-${video.id}`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor={`format-${video.id}`}>Formato</Label>
            <Input
              id={`format-${video.id}`}
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              placeholder="Ex: Reels, Stories, Feed, YouTube"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor={`reference_links-${video.id}`}>Links de Referência</Label>
            <Textarea
              id={`reference_links-${video.id}`}
              value={formData.reference_links}
              onChange={(e) => setFormData({ ...formData, reference_links: e.target.value })}
              placeholder="Cole os links de referência aqui"
              rows={2}
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor={`script_text-${video.id}`}>Roteiro/Texto</Label>
            <Textarea
              id={`script_text-${video.id}`}
              value={formData.script_text}
              onChange={(e) => setFormData({ ...formData, script_text: e.target.value })}
              placeholder="Escreva o roteiro do vídeo aqui"
              rows={6}
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor={`responsible_id-${video.id}`}>Responsável</Label>
            <Select
              value={formData.responsible_id}
              onValueChange={(value) => setFormData({ ...formData, responsible_id: value })}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar responsável" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`deadline-${video.id}`}>Prazo</Label>
            <Input
              id={`deadline-${video.id}`}
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              disabled={isPending}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
            
            {!video.is_converted_to_demand && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleConvert}
                disabled={isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                Converter em Demanda
              </Button>
            )}
            
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
