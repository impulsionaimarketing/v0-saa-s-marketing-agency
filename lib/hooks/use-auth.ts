'use client'

import { useEffect, useState } from 'react'

export interface AuthUser {
  id: string
  email: string
  role: string
  area?: string
  name: string
  modules_access?: string[]
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        // Carregar do localStorage
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setUser(userData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar usuário')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  const logout = () => {
    try {
      localStorage.removeItem('user')
      setUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer logout')
    }
  }

  return { user, loading, error, logout }
}
