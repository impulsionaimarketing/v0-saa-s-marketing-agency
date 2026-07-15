'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
import { AppShell } from '@/components/layout/app-shell'
import { ContentApproval, type ContentApprovalData } from '@/components/productions/content-approval'
import { ProductionForm, type ProductionFormData } from '@/components/productions/production-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft, CheckCircle2, PlusCircle, Save, Loader2 } from 'lucide-react'
import { createProduction, updateProduction } from '@/lib/data/productions'
import { createDemand } from '@/lib/data/demands'
import { toast } from 'sonner'

type Step = 'form' | 'approval'

export default function AprovacaoConteudoPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [approvalData, setApprovalData] = useState<ContentApprovalData | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)

  const persistProduction = async (data: ProductionFormData): Promise<string | null> => {
    try {
      const created = await createProduction({
        client_id: data.clientId,
        type: data.type,
        responsible_id: data.responsibleId || undefined,
        status: 'Aprovação do Cliente',
        post_date: data.postDate || undefined,
        notes: data.referenceUrl || undefined,
      })

      if (!created?.id) {
        toast.error('Não foi possível salvar a produção no banco.')
        return null
      }

      let demandId: string | undefined
      try {
        const demand = await createDemand({
          name: data.title || 'Nova produção',
          description: data.caption || data.referenceUrl || null,
          client_id: data.clientId,
          area: data.type,
          responsible_id: data.responsibleId || null,
          deadline: data.postDate || null,
          status: 'Em Produção',
          priority: 'medium',
        })
        demandId = demand?.id
      } catch (demandError) {
        console.error('[v0] Erro ao criar demanda vinculada:', demandError)
      }

      // Upload da capa do reels (quando for vídeo)
      let coverUrl: string | undefined
      if (data.coverFile) {
        try {
          const { uploadFile } = await import('@/lib/upload-client')
          const blob = await uploadFile(
            data.coverFile,
            `/api/upload-video/token?productionId=${created.id}`,
          )
          coverUrl = blob.url
        } catch (coverError) {
          console.error('[v0] Erro no upload da capa:', coverError)
          toast.error('Produção criada, mas houve falha no upload da capa.')
        }
      }

      await updateProduction(created.id, {
        title: data.title,
        caption: data.caption || undefined,
        reference_link: data.referenceUrl || undefined,
        cover_url: coverUrl,
        demand_id: demandId,
      })

      if (data.file) {
        try {
          const { uploadFile } = await import('@/lib/upload-client')

          const blob = await uploadFile(data.file, `/api/upload-video/token?productionId=${created.id}`)

          await fetch('/api/upload-video/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productionId: created.id,
              url: blob.url,
              filename: data.file.name,
              fileSize: data.file.size,
              fileType: data.file.type,
            }),
          })
        } catch (uploadError) {
          console.error('[v0] Erro no upload:', uploadError)
          toast.error('Produção criada, mas houve falha no upload.')
        }
      }

      toast.success('Produção criada com sucesso!')
      return created.id
    } catch (error) {
      console.error('[v0] Erro ao salvar produção:', error)
      toast.error('Houve um erro ao salvar a produção.')
      return null
    }
  }

  const handleSubmit = async (data: ProductionFormData) => {
    setIsSubmitting(true)
    const productionId = await persistProduction(data)
    setApprovalData({
      productionId: productionId || '',
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
    setIsSubmitting(false)
  }

  const handleFinish = () => {
    setIsFinishing(true)
    toast.success('Conteúdo salvo! Disponível na aba Produção.')
    router.push('/producao')
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
                <div className="flex flex-col gap-2 sm:flex-row">
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
                  <Button className="gap-2" onClick={handleFinish} disabled={isFinishing}>
                    {isFinishing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar e Concluir
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm">
              <StepBadge active={step === 'form'} done={step === 'approval'} number={1} label="Criar conteúdo" />
              <div className="h-px flex-1 bg-border sm:max-w-24" />
              <StepBadge active={step === 'approval'} done={false} number={2} label="Aprovação" />
            </div>

            {step === 'form' ? (
              <ProductionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
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
