'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { submitApprovalResponse } from '@/lib/data/approval'
import { Heart, MessageCircle, Check, X, Clock, Loader2 } from 'lucide-react'

type Production = {
  id: string
  title: string
  client_name: string
  responsible_name: string
  post_date: string
  caption: string
  status: string
  video_url: string | null
}

type Decision = 'aprovado' | 'reprovado'

const AGENCY_NAME = 'Impulsionaí Marketing'
const AGENCY_INITIALS = 'IM'

export function ApprovalClient({
  production,
  token,
}: {
  production: Production
  token: string
}) {
  const [decision, setDecision] = useState<Decision | null>(null)
  const [comment, setComment] = useState('')
  const [clientName, setClientName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<Decision | null>(null)
  const [captionExpanded, setCaptionExpanded] = useState(false)

  const isVideo =
    production.video_url && /\.(mp4|mov|webm)$/i.test(production.video_url)

  const handleSelect = (value: Decision) => {
    setDecision((prev) => (prev === value ? null : value))
  }

  const handleSubmit = async () => {
    if (!decision) {
      toast.error('Selecione Aprovar ou Solicitar Ajuste.')
      return
    }
    if (decision === 'reprovado' && !comment.trim()) {
      toast.error('Descreva o ajuste necessário no comentário.')
      return
    }
    setIsSubmitting(true)
    try {
      await submitApprovalResponse({
        token,
        productionId: production.id,
        decision,
        comment: comment.trim() || undefined,
        clientName: clientName.trim() || undefined,
      })
      setSubmitted(decision)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('[v0] Erro ao enviar resposta:', err)
      toast.error('Não foi possível enviar sua resposta. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formattedDate = production.post_date
    ? new Date(production.post_date).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
      })
    : 'A definir'

  // ----------------------------- TELA DE CONFIRMAÇÃO -----------------------------
  if (submitted) {
    const approved = submitted === 'aprovado'
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center px-6 py-16 text-center">
          <div
            className={cn(
              'flex h-24 w-24 items-center justify-center rounded-full',
              approved ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning',
            )}
          >
            {approved ? (
              <Heart className="h-12 w-12 fill-current" />
            ) : (
              <MessageCircle className="h-12 w-12" />
            )}
          </div>
          <h1 className="mt-6 text-xl font-semibold text-foreground">
            {approved ? 'Conteúdo aprovado!' : 'Ajuste solicitado!'}
          </h1>
          <p className="mt-2 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
            {approved
              ? 'Sua aprovação foi registrada e nossa equipe já foi notificada. O conteúdo seguirá para publicação.'
              : 'Recebemos sua solicitação. Nossa equipe irá revisar e enviar uma nova versão em breve.'}
          </p>

          <div className="mt-8 flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
              {AGENCY_INITIALS}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {production.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {production.client_name}
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ----------------------------- TELA PRINCIPAL (estilo Instagram) -----------------------------
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-[480px] px-0 py-4 sm:px-4">
        {/* Card do post */}
        <article className="overflow-hidden border-y border-border bg-card sm:rounded-xl sm:border">
          {/* Cabeçalho do post */}
          <header className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
              {AGENCY_INITIALS}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {AGENCY_NAME}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {production.client_name}
              </p>
            </div>
            <Badge
              variant="outline"
              className="gap-1.5 border-warning/30 bg-warning/15 font-medium text-warning"
            >
              <Clock className="h-3.5 w-3.5" />
              Aguardando Aprovação
            </Badge>
          </header>

          {/* Preview do conteúdo */}
          <div
            className={cn(
              'relative w-full bg-black',
              isVideo ? 'aspect-[9/16]' : 'aspect-square',
            )}
          >
            {isVideo ? (
              <video
                src={production.video_url ?? undefined}
                className="h-full w-full object-contain"
                controls
                playsInline
              />
            ) : production.video_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={production.video_url || "/placeholder.svg"}
                alt={`Conteúdo para aprovação: ${production.title}`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
                Arquivo não disponível
              </div>
            )}
          </div>

          {/* Ações estilo Instagram */}
          <div className="grid grid-cols-2 gap-3 px-4 pb-1 pt-4">
            <button
              type="button"
              onClick={() => handleSelect('aprovado')}
              aria-pressed={decision === 'aprovado'}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold transition-colors',
                decision === 'aprovado'
                  ? 'border-success bg-success text-background'
                  : 'border-success/40 bg-transparent text-success hover:bg-success/10',
              )}
            >
              <Check className="h-5 w-5" />
              Aprovar
            </button>
            <button
              type="button"
              onClick={() => handleSelect('reprovado')}
              aria-pressed={decision === 'reprovado'}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold transition-colors',
                decision === 'reprovado'
                  ? 'border-warning bg-warning text-background'
                  : 'border-warning/40 bg-transparent text-warning hover:bg-warning/10',
              )}
            >
              <X className="h-5 w-5" />
              Solicitar Ajuste
            </button>
          </div>

          {/* Legenda + título + data */}
          <div className="px-4 pb-4 pt-3">
            <p className="text-sm font-semibold text-foreground">{production.title}</p>

            {production.caption?.trim() && (
              <div className="mt-1">
                <p
                  className={cn(
                    'whitespace-pre-wrap text-sm leading-relaxed text-foreground',
                    !captionExpanded && 'line-clamp-3',
                  )}
                >
                  <span className="font-semibold">{AGENCY_NAME}</span>{' '}
                  {production.caption}
                </p>
                {!captionExpanded && production.caption.length > 120 && (
                  <button
                    type="button"
                    onClick={() => setCaptionExpanded(true)}
                    className="mt-0.5 text-sm text-muted-foreground"
                  >
                    mais
                  </button>
                )}
              </div>
            )}

            <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
              Data prevista · {formattedDate}
            </p>
          </div>
        </article>

        {/* Comentário e identificação */}
        <section className="mt-3 space-y-3 px-4 sm:px-0">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              decision === 'reprovado'
                ? 'Descreva o ajuste necessário...'
                : 'Adicionar um comentário...'
            }
            className="min-h-[72px] resize-none border-border bg-card"
          />
          <Input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Seu nome"
            className="border-border bg-card"
          />

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full gap-2"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar'
            )}
          </Button>
        </section>
      </main>
    </div>
  )
}
