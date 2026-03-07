import { Suspense } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { CobrancasContent } from '@/components/payments/cobrancas-content'

export default function CobrancasPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<div>Carregando...</div>}>
          <CobrancasContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  )
}
