'use client'

import React from "react"

import { useState, createContext, useContext } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import type { UserRole } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface AppContextType {
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

const AppContext = createContext<AppContextType>({
  currentRole: 'Admin',
  setCurrentRole: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
})

export function useAppContext() {
  return useContext(AppContext)
}

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [currentRole, setCurrentRole] = useState<UserRole>('Admin')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <AppContext.Provider value={{ currentRole, setCurrentRole, sidebarCollapsed, setSidebarCollapsed }}>
      <div className="min-h-screen bg-background">
        <Sidebar 
          mobileOpen={mobileOpen} 
          setMobileOpen={setMobileOpen}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <div className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        )}>
          <Topbar
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            onMenuClick={() => setMobileOpen(true)}
          />
          <main className="p-3 sm:p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  )
}
