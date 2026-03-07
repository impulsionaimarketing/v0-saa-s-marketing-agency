'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ReactNode, createContext, useContext, useEffect, useState } from 'react'

export interface AuthUser {
  id: string
  email: string
  role: string
  area?: string
  name: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setUser(userData)
        }
      } catch (error) {
        console.error('[v0] Error loading user from localStorage:', error)
      }
      setLoading(false)
    }

    loadUser()
  }, [])

  const logout = () => {
    try {
      localStorage.removeItem('user')
      setUser(null)
      router.push('/auth/login')
    } catch (error) {
      console.error('[v0] Error logging out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
