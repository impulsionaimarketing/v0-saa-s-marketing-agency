'use client'

import { useEffect, useState, useTransition } from 'react'
import { FileText, Video, ImageIcon, Plus, Trash2, Loader2, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  getClientDocuments, createClientDocument, deleteClientDocument, type ClientDocument,
} from '@/lib/data/client-documents'
import { DOCUMENT_TEMPLATES, MONTH_NAMES, type DocumentTemplate } from '@/lib/documents/templates'
import { DocumentEditor } from './document-editor'

const TEMPLATE_ICON: Record<DocumentTemplate, typeof FileText> = {
  blank: FileText,
  video: Video,
  arte: ImageIcon,
}

interface DocumentsSectionProps {
  clientId: string
  clientName?: string
}

export function DocumentsSection({ clientId, clientName }: DocumentsSectionProps) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [docs, setDocs] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [template, setTemplate] = useState<DocumentTemplate>('video')
  const [quantity, setQuantity] = useState(5)
  const [openDoc, setOpenDoc] = useState<ClientDocument | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setDocs(await getClientDocuments(clientId))
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  const handleCreate = () => {
    setError(null)
    startTransition(async () => {
      try {
        const created = await createClientDocument({
          clientId, clientName, template, month, year,
          quantity: DOCUMENT_TEMPLATES.find((t) => t.id === template)?.hasQuantity ? quantity : undefined,
        })
        setOpen(false)
        setOpenDoc(created)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao criar documento')
      }
    })
  }

  const handleDelete = async (doc: ClientDocument) => {
    if (!confirm(`Excluir "${doc.title}"? Esta ação não pode ser desfeita.`)) return
    await deleteClientDocument(doc.id)
    setDocs((prev) => prev.filter((d) => d.id !== doc.id))
  }

  if (openDoc) {
    return (
      <DocumentEditor
        key={openDoc.id}
        document={openDoc}
        onBack={() => { setOpenDoc(null); load() }}
      />
    )
  }

  const selected = DOCUMENT_TEMPLATES.find((t) => t.id === template)!
  const thisYear = new Date().getFullYear()
  const years = [thisYear - 1, thisYear, thisYear + 1]

  // Agrupa por mês (mais recente primeiro), como subpastas
  const groupMap = new Map<string, { key: string; label: string; order: number; docs: ClientDocument[] }>()
  for (const doc of docs) {
    const key = doc.year && doc.month ? `${doc.year}-${doc.month}` : 'sem-data'
    const label = doc.year && doc.month ? `${MONTH_NAMES[doc.month - 1]} ${doc.year}` : 'Sem data'
    if (!groupMap.has(key)) groupMap.set(key, { key, label, order: doc.year && doc.month ? doc.year * 12 + doc.month : 0, docs: [] })
    groupMap.get(key)!.docs.push(doc)
  }
  const groups = Array.from(groupMap.values()).sort((a, b) => b.order - a.order)

  return (
    <Card className="bg-card border-border">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Documentos</CardTitle>
            <CardDescription>Planejamentos e roteiros desta pasta</CardDescription>
          </div>
          <Button className="shrink-0 gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo documento</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : docs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Esta pasta ainda está vazia.
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Criar o primeiro documento</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.key}>
                <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <FolderOpen className="h-4 w-4" />
                  {group.label}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.docs.map((doc) => {
                    const Icon = TEMPLATE_ICON[doc.template] || FileText
                    return (
                      <div
                        key={doc.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setOpenDoc(doc)}
                        onKeyDown={(e) => e.key === 'Enter' && setOpenDoc(doc)}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/20 p-3 transition-colors active:bg-muted/50 sm:hover:bg-muted/40"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Editado em {new Date(doc.updated_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label="Excluir documento"
                          onClick={(e) => { e.stopPropagation(); handleDelete(doc) }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Novo documento</DialogTitle>
            <DialogDescription>
              {MONTH_NAMES[month - 1]} de {year}{clientName ? ` · ${clientName}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {DOCUMENT_TEMPLATES.map((t) => {
              const Icon = TEMPLATE_ICON[t.id]
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                    template === t.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/30',
                  )}
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>
                    <span className="block text-sm font-medium">{t.label}</span>
                    <span className="block text-xs text-muted-foreground">{t.description}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, i) => (
                  <SelectItem key={name} value={String(i + 1)}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selected.hasQuantity && (
            <div className="grid gap-2">
              <Label htmlFor="doc-qty">{template === 'video' ? 'Quantidade de vídeos' : 'Quantidade de artes'}</Label>
              <Input
                id="doc-qty" type="number" min={1} max={60} value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                className="bg-secondary border-border"
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleCreate} disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar documento'}
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
