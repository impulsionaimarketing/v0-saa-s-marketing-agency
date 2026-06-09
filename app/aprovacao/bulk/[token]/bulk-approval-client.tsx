'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Clock, Send, Video, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductionFile {
  id: string
  filename: string
  url: string
  file_type?: string
}

interface Production {
  id: string
  title: string
  caption: string
  status: string
  type: string
  post_date?: string
  client_name: string
  files: ProductionFile[]
}

interface BulkApprovalClientProps {
  productions: Production[]
  token: string
}

type Decision = 'aprovado' | 'reprovado' | null

interface ProductionDecision {
  decision: Decision
  comment: string
}

export function BulkApprovalClient({ productions, token }: BulkApprovalClientProps) {
  const [decisions, setDecisions] = useState<Record<string, ProductionDecision>>(
    Object.fromEntries(productions.map((p) => [p.id, { decision: null, comment: '' }]))
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const setDecision = (id: string, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [id]: { ...prev[id], decision } }))
  }

  const setComment = (id: string, comment: string) => {
    setDecisions((prev) => ({ ...prev, [id]: { ...prev[id], comment } }))
  }

  const allAnswered = productions.every((p) => decisions[p.id]?.decision !== null)
  const answeredCount = productions.filter((p) => decisions[p.id]?.decision !== null).length

  const handleSubmit = async () => {
    if (!allAnswered) return
    setIsSubmitting(true)

    try {
      await fetch('/api/approval/bulk-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          decisions: Object.entries(decisions).map(([productionId, d]) => ({
            productionId,
            decision: d.decision,
            comment: d.comment,
          })),
        }),
      })
      setSubmitted(true)
    } catch (error) {
      console.error('Erro ao enviar respostas:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold">Respostas enviadas!</h1>
          <p className="text-muted-foreground">
            Obrigado! Suas respostas foram registradas e a equipe será notificada.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Aprovação de Conteúdos</h1>
            <p className="text-sm text-muted-foreground">
              {answeredCount} de {productions.length} respondidos
            </p>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Enviando...' : 'Enviar Respostas'}
          </Button>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-1 bg-primary transition-all"
            style={{ width: `${(answeredCount / productions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Productions */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {productions.map((production, index) => {
          const d = decisions[production.id]
          const firstFile = production.files[0]
          const isVideo = firstFile?.file_type?.startsWith('video/')

          return (
            <Card key={production.id} className={cn(
              'border-2 transition-colors',
              d.decision === 'aprovado' && 'border-emerald-500',
              d.decision === 'reprovado' && 'border-orange-500',
              d.decision === null && 'border-border',
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {index + 1} de {productions.length}
                  </Badge>
                  {d.decision === 'aprovado' && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Aprovado
                    </Badge>
                  )}
                  {d.decision === 'reprovado' && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                      <XCircle className="h-3 w-3 mr-1" /> Ajuste solicitado
                    </Badge>
                  )}
                  {d.decision === null && (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" /> Pendente
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base">{production.title}</CardTitle>
                {production.client_name && (
                  <p className="text-xs text-muted-foreground">{production.client_name}</p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Media */}
                {firstFile && (
                  <div className="rounded-xl overflow-hidden bg-muted aspect-video">
                    {isVideo ? (
                      <video
                        src={firstFile.url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={firstFile.url}
                        alt={production.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}

                {/* Caption */}
                {production.caption && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{production.caption}</p>
                  </div>
                )}

                {/* Decision buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={d.decision === 'aprovado' ? 'default' : 'outline'}
                    className={cn(
                      'gap-2',
                      d.decision === 'aprovado' && 'bg-emerald-600 hover:bg-emerald-700'
                    )}
                    onClick={() => setDecision(production.id, 'aprovado')}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button
                    variant={d.decision === 'reprovado' ? 'default' : 'outline'}
                    className={cn(
                      'gap-2',
                      d.decision === 'reprovado' && 'bg-orange-500 hover:bg-orange-600'
                    )}
                    onClick={() => setDecision(production.id, 'reprovado')}
                  >
                    <XCircle className="h-4 w-4" />
                    Solicitar Ajuste
                  </Button>
                </div>

                {/* Comment for adjustment */}
                {d.decision === 'reprovado' && (
                  <Textarea
                    placeholder="Descreva o ajuste necessário..."
                    value={d.comment}
                    onChange={(e) => setComment(production.id, e.target.value)}
                    className="resize-none min-h-[80px]"
                  />
                )}
              </CardContent>
            </Card>
          )
        })}

        {/* Bottom submit */}
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered || isSubmitting}
          className="w-full gap-2 h-12 text-base"
          size="lg"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Enviando...' : `Enviar ${productions.length} Respostas`}
        </Button>
      </div>
    </div>
  )
}
