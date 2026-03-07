'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string
  requiredArea?: string
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredArea,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/auth/login')
      return
    }

    if (requiredRole && user.role !== requiredRole) {
      router.push('/dashboard')
      return
    }

    if (requiredArea && user.area !== requiredArea) {
      router.push('/dashboard')
      return
    }
  }, [user, loading, requiredRole, requiredArea, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    )
  }

  if (requiredArea && user.area !== requiredArea) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar este setor.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
