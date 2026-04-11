'use client'

import React from "react"

import { useState, createContext, useContext } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { AgentChat } from '@/components/ai-agent/agent-chat'
import type { UserRole } from '@/lib/mock-data'

interface AppContextType {
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void
}

const AppContext = createContext<AppContextType>({
  currentRole: 'Admin',
  setCurrentRole: () => {},
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

  return (
    <AppContext.Provider value={{ currentRole, setCurrentRole }}>
      <div className="min-h-screen bg-background">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <div className="lg:pl-64 transition-all duration-300">
          <Topbar
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            onMenuClick={() => setMobileOpen(true)}
          />
          <main className="p-3 sm:p-4 md:p-6">
            {children}
          </main>
        </div>
        <AgentChat />
      </div>
    </AppContext.Provider>
  )
}
