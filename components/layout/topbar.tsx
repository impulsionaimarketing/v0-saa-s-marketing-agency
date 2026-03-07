'use client'

import { Search, Bell, LogOut } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/hooks/use-auth'
import { useState, useEffect } from 'react'
import { getAlerts, type Alert } from '@/lib/data/alerts'
import { useRouter } from 'next/navigation'
import { clearAuthCookie } from '@/lib/auth/cookies'

interface TopbarProps {
  onRoleChange?: (role: string) => void
  currentRole?: string
}

export function Topbar({ onRoleChange, currentRole }: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await getAlerts()
        setAlerts(data || [])
      } catch (error) {
        console.error('[v0] Error fetching alerts:', error)
        setAlerts([])
      } finally {
        setLoading(false)
      }
    }
    fetchAlerts()
  }, [])

  const handleLogout = async () => {
    localStorage.removeItem('user')
    await clearAuthCookie()
    router.push('/auth/login')
  }

  const unreadAlerts = alerts.filter(a => a.is_resolved === false).length
  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-6 gap-2 sm:gap-4">
      {/* Search */}
      <div className="hidden sm:flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 bg-secondary border-border text-sm"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative h-9 w-9 sm:h-10 sm:w-10">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {unreadAlerts > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                  {unreadAlerts}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 sm:w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!loading && alerts.length > 0 ? (
              <>
                {alerts.slice(0, 5).map((alert) => (
                  <DropdownMenuItem key={alert.id} className="flex flex-col items-start gap-1 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        alert.severity === 'high' ? 'bg-destructive' : 
                        alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-muted'
                      }`} />
                      <span className="font-medium text-sm">{alert.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{alert.description}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-primary">
                  Ver todos os alertas
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem disabled className="text-center py-3">
                Nenhuma notificação
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu with logout */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 h-9 sm:h-10 px-2 sm:px-3">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {userInitial}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs font-medium leading-tight">{user.name}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{user.email}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="flex flex-col gap-2">
                <span className="font-medium text-sm">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
                <span className="text-xs text-muted-foreground">Função: {user.role}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  )
}
