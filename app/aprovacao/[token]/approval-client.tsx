'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { submitApprovalResponse } from '@/lib/data/approval'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  CalendarClock,
  MessageSquare,
  Loader2,
} from 'lucide-react'

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

  const isVideo =
    production.video_url && /\.(mp4|mov|webm)$/i.test(production.video_url)

  const handleSubmit = async () => {
    if (!decision) return
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
        year: 'numeric',
      })
    : 'A definir'

  // ----------------------------- TELA DE CONFIRMAÇÃO -----------------------------
  if (submitted) {
    const approved = submitted === 'aprovado'
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader status={approved ? 'Aprovado' : 'Solicitou Ajuste'} />
        <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center">
          <div
            className={cn(
              'flex h-20 w-20 items-center justify-center rounded-full',
              approved ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning',
            )}
          >
            {approved ? (
              <CheckCircle2 className="h-10 w-10" />
            ) : (
              <MessageSquare className="h-10 w-10" />
            )}
          </div>
          <h1 className="mt-6 text-2xl font-bold text-foreground">
            {approved ? 'Conteúdo Aprovado!' : 'Ajuste Solicitado!'}
          </h1>
          <p className="mt-2 max-w-md text-pretty text-muted-foreground">
            {approved
              ? 'Obrigado! Sua aprovação foi registrada e nossa equipe já foi notificada. O conteúdo seguirá para publicação.'
              : 'Recebemos sua solicitação de ajuste. Nossa equipe irá revisar o conteúdo e enviar uma nova versão em breve.'}
          </p>

          <Card className="mt-8 w-full border-border bg-card text-left">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {production.title}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {production.client_name}
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // ----------------------------- TELA PRINCIPAL -----------------------------
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader status="Aguardando Aprovação" />

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        {/* Preview do conteúdo */}
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl border border-border bg-black">
              <div className="relative aspect-[9/16] w-full">
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
                    src={production.video_url}
                    alt={`Conteúdo para aprovação: ${production.title}`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
                    Arquivo não disponível
                  </div>
                )}
              </div>
            </div>
            <h1 className="mt-5 text-balance text-center text-lg font-semibold text-foreground">
              {production.title}
            </h1>
          </CardContent>
        </Card>

        {/* Metadados */}
        <Card className="border-border bg-card">
          <CardContent className="grid grid-cols-2 gap-4 p-5">
            <MetaItem icon={Building2} label="Cliente" value={production.client_name} />
            <MetaItem icon={CalendarClock} label="Data de postagem" value={formattedDate} />
          </CardContent>
        </Card>

        {/* Legenda */}
        {production.caption?.trim() && (
          <Card className="border-border bg-card">
            <CardContent className="p-5">
              <p className="mb-2 text-sm font-semibold text-foreground">Legenda</p>
              <div className="whitespace-pre-wrap rounded-xl border border-border bg-secondary/40 p-4 text-sm leading-relaxed text-foreground">
                {production.caption}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Decisão */}
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-5">
            <p className="text-sm font-semibold text-foreground">Sua decisão</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('aprovado')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors',
                  decision === 'aprovado'
                    ? 'border-success bg-success/10 text-success'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:border-success/40',
                )}
              >
                <CheckCircle2 className="h-7 w-7" />
                <span className="text-sm font-medium">Aprovar</span>
              </button>
              <button
                type="button"
                onClick={() => setDecision('reprovado')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors',
                  decision === 'reprovado'
                    ? 'border-warning bg-warning/10 text-warning'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:border-warning/40',
                )}
              >
                <XCircle className="h-7 w-7" />
                <span className="text-sm font-medium">Solicitar Ajuste</span>
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium text-foreground">
                Comentário{' '}
                <span className="text-muted-foreground">
                  {decision === 'reprovado' ? '(obrigatório)' : '(opcional)'}
                </span>
              </label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  decision === 'reprovado'
                    ? 'Descreva o que precisa ser ajustado...'
                    : 'Deixe uma observação (opcional)...'
                }
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="clientName" className="text-sm font-medium text-foreground">
                Seu nome <span className="text-muted-foreground">(confirma sua identidade)</span>
              </label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Digite seu nome"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!decision || isSubmitting}
              className="w-full gap-2"
              size="lg"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirmar Resposta
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

function PublicHeader({ status }: { status: string }) {
  const tone =
    status === 'Aprovado'
      ? 'bg-success/15 text-success border-success/30'
      : status === 'Solicitou Ajuste'
        ? 'bg-warning/15 text-warning border-warning/30'
        : 'bg-warning/15 text-warning border-warning/30'

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <span className="text-sm font-bold text-foreground">Impulsionaí Marketing</span>
        <Badge variant="outline" className={cn('gap-1.5 font-medium', tone)}>
          <Clock className="h-3.5 w-3.5" />
          {status}
        </Badge>
      </div>
    </header>
  )
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
