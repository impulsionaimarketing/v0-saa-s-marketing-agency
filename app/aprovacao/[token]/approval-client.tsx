'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { submitApprovalResponse } from '@/lib/data/approval'
import { MediaCarousel, type CarouselMedia } from '@/components/productions/media-carousel'
import { Heart, MessageCircle, Check, X, Clock, Loader2, CheckCircle2 } from 'lucide-react'

type Production = {
  id: string
  title: string
  client_name: string
  responsible_name: string
  post_date: string
  caption: string
  status: string
  video_url: string | null
  files: CarouselMedia[]
}

type Decision = 'aprovado' | 'reprovado'

type ProductionDecision = {
  decision: Decision | null
  comment: string
}

const AGENCY_NAME = 'Impulsionaí Marketing'
const AGENCY_INITIALS = 'IM'

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
    // Valida que todos têm decisão
    const undecided = productions.filter((p) => !decisions[p.id]?.decision)
    if (undecided.length > 0) {
      toast.error(`Tome uma decisão para todos os conteúdos antes de confirmar.`)
      return
    }

    // Valida comentário obrigatório para reprovados
    const missingComment = productions.filter(
      (p) => decisions[p.id]?.decision === 'reprovado' && !decisions[p.id]?.comment.trim()
    )
    if (missingComment.length > 0) {
      toast.error(`Descreva o ajuste necessário para os conteúdos reprovados.`)
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

  // ----------------------------- TELA DE CONFIRMAÇÃO -----------------------------
  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="mt-6 text-xl font-semibold text-foreground">
            Respostas enviadas!
          </h1>
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

  // ----------------------------- FEED DE PRODUÇÕES -----------------------------
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-[480px] px-0 py-4 sm:px-4">

        {/* Header com contagem */}
        <div className="mb-4 flex items-center justify-between px-4 sm:px-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
            {AGENCY_INITIALS}
          </div>
          <Badge variant="outline" className="gap-1.5 border-warning/30 bg-warning/15 font-medium text-warning">
            <Clock className="h-3.5 w-3.5" />
            {productions.length} conteúdo{productions.length > 1 ? 's' : ''} para aprovar
          </Badge>
        </div>

        {/* Feed de posts */}
        <div className="space-y-6">
          {productions.map((production, index) => {
            const d = decisions[production.id]
            const mediaItems: CarouselMedia[] =
              production.files && production.files.length > 0
                ? production.files
                : production.video_url
                  ? [{ url: production.video_url, file_type: null }]
                  : []
            const firstItem = mediaItems[0]
            const firstIsVideo = firstItem
              ? (firstItem.file_type
                  ? firstItem.file_type.startsWith('video/') || firstItem.file_type === 'video'
                  : /\.(mp4|mov|webm|m4v)$/i.test(firstItem.url))
              : false
            const formattedDate = production.post_date
              ? new Date(production.post_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
              : 'A definir'

            return (
              <article key={production.id} className="overflow-hidden border-y border-border bg-card sm:rounded-xl sm:border">
                {/* Cabeçalho */}
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

                {/* Preview */}
                <MediaCarousel
                  items={mediaItems}
                  alt={production.title}
                  aspectClassName={firstIsVideo ? 'aspect-[9/16]' : 'aspect-square'}
                />

                {/* Botões de decisão */}
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

                {/* Legenda */}
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

                {/* Comentário (aparece quando reprovado) */}
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

        {/* Seção de confirmação global */}
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
