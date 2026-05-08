'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { ProductionCard, ProductionCardSkeleton } from '@/components/productions/production-card'
import { useAuth } from '@/lib/hooks/use-auth'

interface Production {
  id: string
  client_id: string
  client_name?: string
  type: 'Vídeo' | 'Arte'
  responsible_id?: string
  responsible_name?: string
  status: string
  post_date?: string
  notes?: string
  demand_id?: string
  created_at: string
  // Additional fields from the new spec
  title?: string
  priority?: string
  script?: string
  description?: string
  reference_url?: string
  media_url?: string
  final_url?: string
}

export default function ProducaoPage() {
  const { user } = useAuth()
  const [productions, setProductions] = useState<Production[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProductions = async () => {
      try {
        const res = await fetch('/api/productions')
        if (!res.ok) throw new Error('Falha ao carregar produções')
        const data = await res.json()
        setProductions(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProductions()
  }, [])

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/productions/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar status')
      const updated = await res.json()
      // Update local state
      setProductions(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err)
      alert('Erro ao atualizar status: ' + err.message)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <ModuleAccessWrapper moduleName="producoes" moduleDisplayName="Produções">
          <AppShell>
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Produção de Conteúdo</h1>
                <p className="text-muted-foreground">Pipeline visual de criativos</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <ProductionCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </AppShell>
        </ModuleAccessWrapper>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <ModuleAccessWrapper moduleName="producoes" moduleDisplayName="Produções">
          <AppShell>
            <div className="p-4 text-red-600">Erro: {error}</div>
          </AppShell>
        </ModuleAccessWrapper>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="producoes" moduleDisplayName="Produções">
        <AppShell>
          <div className="space-y-6">
            {/* Page header */}
            <div>
              <h1 className="text-2xl font-bold">Produção de Conteúdo</h1>
              <p className="text-muted-foreground">Pipeline visual de criativos</p>
            </div>

            {/* Production Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productions.map((prod) => (
                <ProductionCard
                  key={prod.id}
                  production={prod}
                  onUpdateStatus={handleUpdateStatus}
                  isLoading={false}
                />
              ))}
            </div>

            {productions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma produção encontrada.
              </div>
            )}
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}