'use client'

import React from "react"
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Film,
  Target,
  FileText,
  UserCircle,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  Lock,
  CheckSquare,
  Calendar,
  Kanban,
  Instagram,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useModuleAccess } from '@/lib/hooks/use-module-access'

interface MenuItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  moduleName?: string
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, moduleName: 'dashboard' },
  { name: 'CRM', href: '/crm', icon: Kanban, moduleName: 'crm' },
  { name: 'Clientes', href: '/clientes', icon: Users, moduleName: 'clientes' },
  { name: 'Onboarding', href: '/onboarding', icon: CheckSquare, moduleName: 'clientes' },
  { name: 'Cobranças', href: '/cobrancas', icon: CreditCard, moduleName: 'cobrancas' },
  { name: 'Cronograma Mensal', href: '/cronograma', icon: Calendar, moduleName: 'clientes' },
  { name: 'Demandas', href: '/demandas', icon: ClipboardList, moduleName: 'demandas' },
  { name: 'Produção', href: '/producao', icon: Film, moduleName: 'producoes' },
  { name: 'Stories Automáticos', href: '/stories-automaticos', icon: Instagram, moduleName: 'stories_automaticos' },
  { name: 'Tráfego Pago', href: '/trafego', icon: Target, moduleName: 'campanhas' },
  { name: 'Relatórios', href: '/relatorios', icon: FileText, moduleName: 'relatorios' },
  { name: 'Colaboradores', href: '/colaboradores', icon: UserCircle, moduleName: 'usuarios' },
  { name: 'Alertas', href: '/alertas', icon: AlertTriangle, moduleName: 'alertas' },
  { name: 'Configurações', href: '/configuracoes', icon: Settings, moduleName: 'configuracoes' },
]

interface SidebarProps {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

function SidebarMenuItemContent({ item }: { item: MenuItem }) {
  const { isBlocked } = useModuleAccess(item.moduleName || '')

  return isBlocked ? <Lock className="h-4 w-4 text-red-500" /> : null
}

export function Sidebar({ mobileOpen, setMobileOpen, collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname()

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        'flex items-center justify-center border-b border-sidebar-border',
        collapsed ? 'h-16 px-2' : 'h-24 px-3'
      )}>
        {!collapsed && (
          <Link href="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
            <Image 
              src="https://impulsionaimarketing.com.br/wp-content/uploads/2026/02/Impulsionai-4-1.png" 
              alt="Impulsionaí" 
              width={150}
              height={60}
              className="h-auto w-32"
            />
          </Link>
        )}
        {collapsed && (
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-white">I</span>
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.moduleName && <SidebarMenuItemContent item={item} />}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse button */}
      <div className="border-t border-sidebar-border p-3 hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 hidden lg:block',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
