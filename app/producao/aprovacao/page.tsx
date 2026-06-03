'use client'

import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { ContentApproval } from '@/components/productions/content-approval'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default function AprovacaoConteudoPage() {
  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="producoes" moduleDisplayName="Produções">
        <AppShell>
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 -ml-2">
                    <Link href="/producao" aria-label="Voltar para Produção">
                      <ChevronLeft className="h-5 w-5" />
                    </Link>
                  </Button>
                  <h1 className="text-2xl font-bold">Aprovação de Conteúdo</h1>
                </div>
                <p className="text-muted-foreground">
                  Gerencie a revisão e aprovação do vídeo com o cliente
                </p>
              </div>
            </div>

            <ContentApproval />
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
