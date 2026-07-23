'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MediaCarousel } from '@/components/productions/media-carousel'
import { cn } from '@/lib/utils'
import {
  submitApprovalResponse,
  type ApprovalElement,
  type ClientPortalData,
  type ClientPortalProduction,
} from '@/lib/data/approval'
import {
  Check,
  X,
  Clock,
  Loader2,
  CheckCircle2,
  Download,
  ImageIcon,
  Film,
  Type,
  MessageSquareWarning,
} from 'lucide-react'

const AGENCY_NAME = 'Impulsionaí Marketing'
const AGENCY_INITIALS = 'IM'

type Decision = 'aprovado' | 'reprovado'
type ElementState = { decision: Decision | null; comment: string }

const ELEMENT_META: Record<ApprovalElement, { label: string; icon: typeof ImageIcon }> = {
  capa: { label: 'Capa', icon: ImageIcon },
  midia: { label: 'Mídia', icon: Film },
  legenda: { label: 'Legenda', icon: Type },
}

function getElements(p: ClientPortalProduction): ApprovalElement[] {
  const els: ApprovalElement[] = []
  if (p.type === 'Vídeo' && p.cover_url) els.push('capa')
  els.push('midia')
  if (p.caption?.trim()) els.push('legenda')
  return els
}

export function ClientPortal({ data }: { data: ClientPortalData }) {
  // Estado local: produções aguardando aprovação podem sair da lista após envio.
  const [productions, setProductions] = useState<ClientPortalProduction[]>(data.productions)

  const pending = useMemo(
    () => productions.filter((p) => p.status === 'Aprovação do Cliente'),
    [productions],
  )
  const adjusting = useMemo(
    () => productions.filter((p) => p.status === 'Solicitou Ajuste'),
    [productions],
  )
  const approved = useMemo(
    () => productions.filter((p) => p.status === 'Aprovado'),
    [productions],
  )

  const [tab, setTab] = useState('pending')

  const handleApproved = (productionId: string, allApproved: boolean) => {
    setProductions((prev) =>
      prev.map((p) =>
        p.id === productionId
          ? { ...p, status: allApproved ? 'Aprovado' : 'Solicitou Ajuste' }
          : p,
      ),
    )
    // Direciona o cliente para a aba resultante
    setTab(allApproved ? 'approved' : 'adjusting')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
            {AGENCY_INITIALS}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{AGENCY_NAME}</p>
            <p className="truncate text-xs text-muted-foreground">
              Central de conteúdos · {data.clientName}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-0 py-4 sm:px-4">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mx-4 grid w-[calc(100%-2rem)] grid-cols-3 sm:mx-0 sm:w-full">
            <TabsTrigger value="pending" className="gap-1.5 text-xs sm:text-sm">
              <Clock className="h-3.5 w-3.5" />
              Aprovação
              {pending.length > 0 && (
                <span className="ml-0.5 rounded-full bg-warning/20 px-1.5 text-[10px] font-semibold text-warning">
                  {pending.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="adjusting" className="gap-1.5 text-xs sm:text-sm">
              <MessageSquareWarning className="h-3.5 w-3.5" />
              Ajustes
              {adjusting.length > 0 && (
                <span className="ml-0.5 rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                  {adjusting.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1.5 text-xs sm:text-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Aprovados
              {approved.length > 0 && (
                <span className="ml-0.5 rounded-full bg-success/20 px-1.5 text-[10px] font-semibold text-success">
                  {approved.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ─── Aba: Para Aprovação ─── */}
          <TabsContent value="pending" className="mt-4 space-y-6">
            {pending.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Nenhum conteúdo pendente"
                description="Você está em dia! Não há conteúdos aguardando sua aprovação no momento."
              />
            ) : (
              pending.map((p) => (
                <ApprovalCard key={p.id} production={p} onDone={handleApproved} />
              ))
            )}
          </TabsContent>

          {/* ─── Aba: Ajustes Solicitados ─── */}
          <TabsContent value="adjusting" className="mt-4 space-y-6">
            {adjusting.length === 0 ? (
              <EmptyState
                icon={MessageSquareWarning}
                title="Nenhum ajuste solicitado"
                description="Os ajustes que você pedir aparecerão aqui enquanto nossa equipe trabalha neles."
              />
            ) : (
              adjusting.map((p) => <AdjustingCard key={p.id} production={p} />)
            )}
          </TabsContent>

          {/* ─── Aba: Aprovados ─── */}
          <TabsContent value="approved" className="mt-4 space-y-6">
            {approved.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Nenhum conteúdo aprovado ainda"
                description="Assim que você aprovar um conteúdo, ele ficará disponível aqui para download."
              />
            ) : (
              approved.map((p) => <ApprovedCard key={p.id} production={p} />)
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// ─── Card de aprovação (interativo, por elemento) ─────────────────────────────
function ApprovalCard({
  production,
  onDone,
}: {
  production: ClientPortalProduction
  onDone: (productionId: string, allApproved: boolean) => void
}) {
  const elements = getElements(production)
  const [states, setStates] = useState<Record<string, ElementState>>(() =>
    Object.fromEntries(elements.map((el) => [el, { decision: null, comment: '' }])),
  )
  const [clientName, setClientName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const allDecided = elements.every((el) => states[el]?.decision)

  const select = (el: ApprovalElement, value: Decision) =>
    setStates((prev) => ({
      ...prev,
      [el]: { ...prev[el], decision: prev[el]?.decision === value ? null : value },
    }))

  const comment = (el: ApprovalElement, value: string) =>
    setStates((prev) => ({ ...prev, [el]: { ...prev[el], comment: value } }))

  const handleSubmit = async () => {
    if (!allDecided) {
      toast.error('Tome uma decisão para cada item antes de enviar.')
      return
    }
    for (const el of elements) {
      if (states[el].decision === 'reprovado' && !states[el].comment.trim()) {
        toast.error('Descreva o ajuste necessário em cada item marcado.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      await submitApprovalResponse({
        token: '',
        productionId: production.id,
        clientName: clientName.trim() || undefined,
        elements: elements.map((el) => ({
          element: el,
          decision: states[el].decision!,
          comment: states[el].comment.trim() || undefined,
        })),
      })
      const allApproved = elements.every((el) => states[el].decision === 'aprovado')
      toast.success(allApproved ? 'Conteúdo aprovado!' : 'Ajustes enviados para a equipe!')
      onDone(production.id, allApproved)
    } catch (err) {
      console.error('[v0] Erro ao enviar resposta:', err)
      toast.error('Não foi possível enviar. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <article className="overflow-hidden border-y border-border bg-card sm:rounded-xl sm:border">
      <header className="px-4 pt-3 pb-1">
        <p className="text-sm font-semibold text-foreground">{production.title}</p>
        <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
          Data prevista · {production.post_date}
        </p>
      </header>

      {/* Capa */}
      {elements.includes('capa') && (
        <ElementBlock element="capa">
          <div className="bg-black">
            <div className="relative mx-auto aspect-[9/16] w-full max-w-[280px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={production.cover_url || '/placeholder.svg'}
                alt="Capa do reels"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div className="px-4 py-3">
            <DecisionControls
              state={states.capa}
              onSelect={(v) => select('capa', v)}
              onComment={(v) => comment('capa', v)}
            />
          </div>
        </ElementBlock>
      )}

      {/* Mídia */}
      <ElementBlock element="midia">
        <MediaCarousel
          items={production.files}
          alt={production.title}
          aspectClassName={production.type === 'Vídeo' ? 'aspect-[9/16]' : 'aspect-square'}
        />
        <div className="px-4 py-3">
          <DecisionControls
            state={states.midia}
            onSelect={(v) => select('midia', v)}
            onComment={(v) => comment('midia', v)}
          />
        </div>
      </ElementBlock>

      {/* Legenda */}
      {elements.includes('legenda') && (
        <ElementBlock element="legenda">
          <div className="px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              <span className="font-semibold">{AGENCY_NAME}</span> {production.caption}
            </p>
          </div>
          <div className="px-4 pb-3">
            <DecisionControls
              state={states.legenda}
              onSelect={(v) => select('legenda', v)}
              onComment={(v) => comment('legenda', v)}
            />
          </div>
        </ElementBlock>
      )}

      {/* Envio */}
      <div className="space-y-3 border-t border-border px-4 py-4">
        <Input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Seu nome (opcional)"
          className="border-border bg-background"
        />
        <Button onClick={handleSubmit} disabled={isSubmitting || !allDecided} className="w-full gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Confirmar resposta'
          )}
        </Button>
      </div>
    </article>
  )
}

// ─── Card de ajustes solicitados (somente leitura) ────────────────────────────
function AdjustingCard({ production }: { production: ClientPortalProduction }) {
  return (
    <article className="overflow-hidden border-y border-border bg-card sm:rounded-xl sm:border">
      <header className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{production.title}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
            Data prevista · {production.post_date}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 gap-1.5 border-warning/30 bg-warning/15 text-warning">
          <Clock className="h-3.5 w-3.5" />
          Em ajuste
        </Badge>
      </header>

      <MediaCarousel
        items={production.files}
        alt={production.title}
        aspectClassName={production.type === 'Vídeo' ? 'aspect-[9/16]' : 'aspect-square'}
      />

      <div className="space-y-2 px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <MessageSquareWarning className="h-3.5 w-3.5" />
          Ajustes solicitados
        </p>
        {production.adjustments.length > 0 ? (
          <ul className="space-y-2">
            {production.adjustments.map((c, i) => (
              <li key={i} className="rounded-lg border border-border bg-secondary/40 p-3 text-sm text-foreground">
                <p className="whitespace-pre-wrap leading-relaxed">{c.comment}</p>
                {c.created_at && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nossa equipe está trabalhando nos ajustes solicitados.
          </p>
        )}
      </div>
    </article>
  )
}

// ─── Card de conteúdo aprovado (com download) ─────────────────────────────────
function ApprovedCard({ production }: { production: ClientPortalProduction }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (production.files.length === 0) {
      toast.error('Nenhum arquivo disponível para download.')
      return
    }
    setDownloading(true)
    try {
      for (const file of production.files) {
        const res = await fetch(file.url)
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = file.filename || 'arquivo'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(objectUrl)
      }
      toast.success(
        production.files.length > 1
          ? `${production.files.length} arquivos baixados!`
          : 'Download iniciado!',
      )
    } catch (err) {
      console.error('[v0] Erro no download:', err)
      toast.error('Não foi possível baixar os arquivos.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <article className="overflow-hidden border-y border-border bg-card sm:rounded-xl sm:border">
      <header className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{production.title}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
            Data prevista · {production.post_date}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 gap-1.5 border-success/30 bg-success/15 text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Aprovado
        </Badge>
      </header>

      <MediaCarousel
        items={production.files}
        alt={production.title}
        aspectClassName={production.type === 'Vídeo' ? 'aspect-[9/16]' : 'aspect-square'}
      />

      {production.caption?.trim() && (
        <div className="px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {production.caption}
          </p>
        </div>
      )}

      <div className="border-t border-border px-4 py-4">
        <Button onClick={handleDownload} disabled={downloading} className="w-full gap-2">
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Baixando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Baixar {production.files.length > 1 ? `${production.files.length} arquivos` : 'conteúdo'}
            </>
          )}
        </Button>
      </div>
    </article>
  )
}

// ─── Auxiliares ───────────────────────────────────────────────────────────────
function DecisionControls({
  state,
  onSelect,
  onComment,
}: {
  state: ElementState
  onSelect: (value: Decision) => void
  onComment: (value: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelect('aprovado')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-semibold transition-colors',
            state.decision === 'aprovado'
              ? 'border-success bg-success text-background'
              : 'border-success/40 bg-transparent text-success hover:bg-success/10',
          )}
        >
          <Check className="h-4 w-4" />
          Aprovar
        </button>
        <button
          type="button"
          onClick={() => onSelect('reprovado')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-semibold transition-colors',
            state.decision === 'reprovado'
              ? 'border-warning bg-warning text-background'
              : 'border-warning/40 bg-transparent text-warning hover:bg-warning/10',
          )}
        >
          <X className="h-4 w-4" />
          Solicitar Ajuste
        </button>
      </div>
      {state.decision === 'reprovado' && (
        <Textarea
          value={state.comment}
          onChange={(e) => onComment(e.target.value)}
          placeholder="Descreva o ajuste necessário..."
          className="min-h-[72px] resize-none border-border bg-background"
        />
      )}
    </div>
  )
}

function ElementBlock({ element, children }: { element: ApprovalElement; children: React.ReactNode }) {
  const meta = ELEMENT_META[element]
  const Icon = meta.icon
  return (
    <div className="border-t border-border">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {meta.label}
        </span>
      </div>
      {children}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Clock
  title: string
  description: string
}) {
  return (
    <div className="mx-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center sm:mx-0">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
