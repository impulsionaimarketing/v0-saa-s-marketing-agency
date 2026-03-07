import { Suspense } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppShell } from '@/components/layout/app-shell'
import { CronogramaContent } from '@/components/cronograma/cronograma-content'

export default function CronogramaPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<div>Carregando...</div>}>
          <CronogramaContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  )
}
