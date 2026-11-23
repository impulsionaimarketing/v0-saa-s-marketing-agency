'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getUsers, type User } from '@/lib/data/users'
import { cn } from '@/lib/utils'

// Escolha do colaborador responsável pela conversa de um lead
export function ResponsibleSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    getUsers({ status: 'Ativo' }).then(setUsers).catch(() => setUsers([]))
  }, [])

  return (
    <div className="grid gap-2">
      <Label>Responsável pela conversa</Label>
      <Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? '' : v)}>
        <SelectTrigger className="bg-secondary border-border">
          <SelectValue placeholder="Escolha o colaborador" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sem responsável</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Selo com as iniciais e o primeiro nome, para o card do kanban
export function ResponsibleBadge({ name, className }: { name?: string | null; className?: string }) {
  if (!name) {
    return <span className={cn('text-[11px] text-muted-foreground/70', className)}>Sem responsável</span>
  }
  const parts = name.trim().split(/\s+/)
  const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
        {initials}
      </span>
      <span className="truncate">{parts[0]}</span>
    </span>
  )
}
