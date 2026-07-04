'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { submitApprovalResponse } from '@/lib/data/approval'
import { Check, X, Clock, Loader2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'

type ProductionFile = {
  url: string
  filename: string
  file_type: string
}

type Production = {
  id: string
  title: string
  client_name: string
  responsible_name: string
  post_date: string
  caption: string
  status: string
  video_url: string | null
  files?: ProductionFile[] | null
}

type Decision = 'aprovado' | 'reprovado'

type ProductionDecision = {
  decision: Decision | null
  comment: string
}

const AGENCY_NAME = 'Impulsionaí Marketing'
const AGENCY_INITIALS = 'IM'

function MediaCarousel({ files, videoUrl }: { files?: ProductionFile[] | null; videoUrl: string | null }) {
  const [current, setCurrent] = useState(0)

  const mediaList: ProductionFile[] = files && files.length > 0
    ? files
    : videoUrl
      ? [{ url: videoUrl, filename: 'media', file_type: videoUrl.match(/\.(mp4|mov|webm)/i) ? 'video/mp4' : 'image/jpeg' }]
      : []

  if (mediaList.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-black text-sm text-muted-foreground">
        Arquivo não disponível
      </div>
    )
  }

  const item = mediaList[current]
  const isVideo = item.file_type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(item.url)

  return (
    <div className="relative w-full bg-black">
      <div className={cn('relative w-full', isVideo ? 'aspect-[9/16]' : 'aspect-square')}>
        {isVideo ? (
          <video
            key={item.url}
            src={item.url}
            className="h-full w-full object-contain"
            controls
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.url}
            src={item.url}
            alt={item.filename}
            className="h-full w-full object-contain"
          />
        )}
      </div>

      {/* Navegação */}
      {mediaList.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrent((prev) => (prev - 1 + mediaList.length) % mediaList.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrent((prev) => (prev + 1) % mediaList.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {mediaList.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                )}
              />
            ))}
          </div>

          {/* Contador */}
          <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
            {current + 1}/{mediaList.length}
          </div>
        </>
      )}
    </div>
  )
}

export function ApprovalClient({
  productions,
  token,
}: {
  productions: Production[]
  token: string
}) {
  const [decisions, setDecisions] = useState<Record<string, ProductionDecision>>(
    Object.fromEntries(productions.map((p) => [p.id, { decision: null, comment: '' }]))
  )
  const [clientName, setClientName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const allDecided = productions.every((p) => decisions[p.id]?.decision !== null)
  const totalApproved = Object.values(decisions).filter((d) => d.decision === 'aprovado').length
  const totalAdjust = Object.values(decisions).filter((d) => d.decision === 'reprovado').length

  const handleSelect = (productionId: string, value: Decision) => {
    setDecisions((prev) => ({
      ...prev,
      [productionId]: {
        ...prev[productionId],
        decision: prev[productionId]?.decision === value ? null : value,
      },
    }))
  }

  const handleComment = (productionId: string, value: string) => {
    setDecisions((prev) => ({
      ...prev,
      [productionId]: { ...prev[productionId], comment: value },
    }))
  }

  const handleSubmit = async () => {
    const undecided = productions.filter((p) => !decisions[p.id]?.decision)
    if (undecided.length > 0) {
      toast.error('Tome uma decisão para todos os conteúdos antes de confirmar.')
      return
    }

    const missingComment = productions.filter(
      (p) => decisions[p.id]?.decision === 'reprovado' && !decisions[p.id]?.comment.trim()
    )
    if (missingComment.length > 0) {
      toast.error('Descreva o ajuste necessário para os conteúdos reprovados.')
      return
    }

    setIsSubmitting(true)
    try {
      await Promise.all(
        productions.map((p) =>
          submitApprovalResponse({
            token,
            productionId: p.id,
            decision: decisions[p.id].decision!,
            comment: decisions[p.id].comment.trim() || undefined,
            clientName: clientName.trim() || undefined,
          })
        )
      )
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('[v0] Erro ao enviar respostas:', err)
      toast.error('Não foi possível enviar suas respostas. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="mt-6 text-xl font-semibold text-foreground">Respostas enviadas!</h1>
          <p className="mt-2 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
            Nossa equipe já foi notificada e irá tomar as providências necessárias.
          </p>
          <div className="mt-8 flex w-full gap-3">
            {totalApproved > 0 && (
              <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-success/30 bg-success/10 py-4">
                <Check className="h-6 w-6 text-success" />
                <p className="text-lg font-bold text-success">{totalApproved}</p>
                <p className="text-xs text-muted-foreground">Aprovado{totalApproved > 1 ? 's' : ''}</p>
              </div>
            )}
            {totalAdjust > 0 && (
              <div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-warning/30 bg-warning/10 py-4">
                <X className="h-6 w-6 text-warning" />
                <p className="text-lg font-bold text-warning">{totalAdjust}</p>
                <p className="text-xs text-muted-foreground">Ajuste{totalAdjust > 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-[480px] px-0 py-4 sm:px-4">
        <div className="mb-4 flex items-center justify-between px-4 sm:px-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
            {AGENCY_INITIALS}
          </div>
          <Badge variant="outline" className="gap-1.5 border-warning/30 bg-warning/15 font-medium text-warning">
            <Clock className="h-3.5 w-3.5" />
            {productions.length} conteúdo{productions.length > 1 ? 's' : ''} para aprovar
          </Badge>
        </div>

        <div className="space-y-6">
          {productions.map((production, index) => {
            const d = decisions[production.id]
            const formattedDate = production.post_date
              ? new Date(production.post_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
              : 'A definir'

            return (
              <article key={production.id} className="overflow-hidden border-y border-border bg-card sm:rounded-xl sm:border">
                <header className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                    {AGENCY_INITIALS}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{AGENCY_NAME}</p>
                    <p className="truncate text-xs text-muted-foreground">{production.client_name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{index + 1}/{productions.length}</span>
                </header>

                <MediaCarousel files={production.files} videoUrl={production.video_url} />

                <div className="grid grid-cols-2 gap-3 px-4 pb-1 pt-4">
                  <button
                    type="button"
                    onClick={() => handleSelect(production.id, 'aprovado')}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold transition-colors',
                      d?.decision === 'aprovado'
                        ? 'border-success bg-success text-background'
                        : 'border-success/40 bg-transparent text-success hover:bg-success/10',
                    )}
                  >
                    <Check className="h-5 w-5" />
                    Aprovar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelect(production.id, 'reprovado')}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold transition-colors',
                      d?.decision === 'reprovado'
                        ? 'border-warning bg-warning text-background'
                        : 'border-warning/40 bg-transparent text-warning hover:bg-warning/10',
                    )}
                  >
                    <X className="h-5 w-5" />
                    Solicitar Ajuste
                  </button>
                </div>

                <div className="px-4 pb-4 pt-3">
                  <p className="text-sm font-semibold text-foreground">{production.title}</p>
                  {production.caption?.trim() && (
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground line-clamp-3">
                      <span className="font-semibold">{AGENCY_NAME}</span>{' '}{production.caption}
                    </p>
                  )}
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                    Data prevista · {formattedDate}
                  </p>
                </div>

                {d?.decision === 'reprovado' && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <Textarea
                      value={d.comment}
                      onChange={(e) => handleComment(production.id, e.target.value)}
                      placeholder="Descreva o ajuste necessário..."
                      className="min-h-[72px] resize-none border-border bg-background"
                    />
                  </div>
                )}
              </article>
            )
          })}
        </div>

        <section className="mt-6 space-y-3 px-4 pb-8 sm:px-0">
          {productions.length > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
              <span className="text-muted-foreground">Decisões tomadas</span>
              <span className="font-semibold text-foreground">
                {Object.values(decisions).filter((d) => d.decision).length}/{productions.length}
              </span>
            </div>
          )}
          <Input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Seu nome"
            className="border-border bg-card"
          />
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !allDecided}
            className="w-full gap-2"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Confirmar todas as respostas'
            )}
          </Button>
          {!allDecided && (
            <p className="text-center text-xs text-muted-foreground">
              Tome uma decisão em cada conteúdo para confirmar
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
