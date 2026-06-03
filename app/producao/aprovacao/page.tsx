'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { ContentApproval, type ContentApprovalData } from '@/components/productions/content-approval'
import { ProductionForm, type ProductionFormData } from '@/components/productions/production-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft, CheckCircle2, PlusCircle } from 'lucide-react'

type Step = 'form' | 'approval'

export default function AprovacaoConteudoPage() {
  const [step, setStep] = useState<Step>('form')
  const [approvalData, setApprovalData] = useState<ContentApprovalData | undefined>(undefined)

  const handleSubmit = (data: ProductionFormData) => {
    setApprovalData({
      title: data.title,
      client: data.client,
      responsible: data.responsible,
      postDate: data.postDate
        ? new Date(data.postDate + 'T00:00:00').toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : 'A definir',
      caption: data.caption,
      poster: data.videoPreview,
      videoName: data.videoName,
    })
    setStep('approval')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
                  <h1 className="text-2xl font-bold">
                    {step === 'form' ? 'Nova Produção' : 'Aprovação de Conteúdo'}
                  </h1>
                </div>
                <p className="text-muted-foreground">
                  {step === 'form'
                    ? 'Faça o upload do vídeo, adicione a legenda e envie para aprovação'
                    : 'Gerencie a revisão e aprovação do vídeo com o cliente'}
                </p>
              </div>

              {step === 'approval' && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setStep('form')
                    setApprovalData(undefined)
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                  Nova Produção
                </Button>
              )}
            </div>

            {/* Indicador de etapas */}
            <div className="flex items-center gap-3 text-sm">
              <StepBadge active={step === 'form'} done={step === 'approval'} number={1} label="Criar conteúdo" />
              <div className="h-px flex-1 bg-border sm:max-w-24" />
              <StepBadge active={step === 'approval'} done={false} number={2} label="Aprovação" />
            </div>

            {step === 'form' ? (
              <ProductionForm onSubmit={handleSubmit} />
            ) : (
              <ContentApproval data={approvalData} />
            )}
          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}

function StepBadge({
  active,
  done,
  number,
  label,
}: {
  active: boolean
  done: boolean
  number: number
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ' +
          (done
            ? 'border-primary bg-primary text-primary-foreground'
            : active
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-secondary text-muted-foreground')
        }
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : number}
      </span>
      <span
        className={
          'font-medium ' + (active || done ? 'text-foreground' : 'text-muted-foreground')
        }
      >
        {label}
      </span>
    </div>
  )
}
