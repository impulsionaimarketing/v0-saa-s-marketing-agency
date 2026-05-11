'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Phone,
  Mail,
  Building2,
  ExternalLink,
  Calendar,
  DollarSign,
  Clock,
  Pencil,
  Trash2,
  Send,
  Loader2,
  User,
  ArrowRight,
  Tag,
  MessageSquare,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import {
  getLead,
  getLeadHistory,
  addNote,
  type CRMLeadV2,
  type CRMTag,
  type CRMActivityHistory,
  PRIORITY_CONFIG,
} from '@/lib/data/crm'

interface CRMLeadDetailSheetProps {
  lead: CRMLeadV2 | null
  tags: CRMTag[]
  open: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onSuccess: () => void
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  lead_created: <User className="h-4 w-4 text-success" />,
  stage_changed: <ArrowRight className="h-4 w-4 text-chart-2" />,
  tag_added: <Tag className="h-4 w-4 text-chart-4" />,
  tag_removed: <Tag className="h-4 w-4 text-muted-foreground" />,
  note_added: <MessageSquare className="h-4 w-4 text-primary" />,
}

const ACTION_LABELS: Record<string, string> = {
  lead_created: 'Lead criado',
  stage_changed: 'Etapa alterada',
  tag_added: 'Tag adicionada',
  tag_removed: 'Tag removida',
  note_added: 'Observação',
}

export function CRMLeadDetailSheet({
  lead: initialLead,
  tags,
  open,
  onClose,
  onEdit,
  onDelete,
  onSuccess,
}: CRMLeadDetailSheetProps) {
  const [lead, setLead] = useState<CRMLeadV2 | null>(initialLead)
  const [history, setHistory] = useState<CRMActivityHistory[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    if (open && initialLead) {
      loadLeadData(initialLead.id)
    }
  }, [open, initialLead?.id])

  async function loadLeadData(leadId: string) {
    setIsLoadingHistory(true)
    try {
      const [leadData, historyData] = await Promise.all([
        getLead(leadId),
        getLeadHistory(leadId),
      ])
      if (leadData) {
        setLead(leadData)
      }
      setHistory(historyData)
    } catch (error) {
      console.error('[CRM] Error loading lead data:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleAddNote = () => {
    if (!newNote.trim() || !lead) return

    startTransition(async () => {
      try {
        await addNote(lead.id, newNote.trim())
        setNewNote('')
        loadLeadData(lead.id)
        onSuccess()
      } catch (error) {
        console.error('[CRM] Error adding note:', error)
      }
    })
  }

  if (!lead) return null

  const priorityConfig = PRIORITY_CONFIG[lead.priority]

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-[500px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl leading-tight truncate">
                {lead.name}
              </SheetTitle>
              {lead.company && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {lead.company}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge 
                  variant="outline" 
                  className={cn('text-xs', priorityConfig.color)}
                >
                  {priorityConfig.label}
                </Badge>
                {lead.value > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {formatCurrency(lead.value)}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="icon" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b px-6 h-auto py-0 bg-transparent">
            <TabsTrigger 
              value="details" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
            >
              Detalhes
            </TabsTrigger>
            <TabsTrigger 
              value="timeline" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
            >
              Timeline
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="details" className="mt-0 p-6">
              <div className="space-y-6">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Contato</h4>
                  <div className="grid gap-3">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{lead.phone}</span>
                      </a>
                    )}
                    {lead.whatsapp && (
                      <a
                        href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span className="text-sm">{lead.whatsapp}</span>
                        <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                      </a>
                    )}
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate">{lead.email}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {lead.tags && lead.tags.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {lead.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{ 
                            backgroundColor: `${tag.color}20`, 
                            color: tag.color,
                            border: `1px solid ${tag.color}40`,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {lead.notes && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Observações</h4>
                    <p className="text-sm whitespace-pre-wrap bg-secondary/50 rounded-lg p-3">
                      {lead.notes}
                    </p>
                  </div>
                )}

                {/* Dates */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Informações</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Criado em
                      </span>
                      <span>{new Date(lead.created_at).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Atualizado em
                      </span>
                      <span>{new Date(lead.updated_at).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0 p-6">
              <div className="space-y-4">
                {/* Add Note */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Adicionar Observação</h4>
                  <div className="flex gap-2">
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Escreva uma observação..."
                      className="min-h-[60px] flex-1"
                    />
                    <Button 
                      size="icon" 
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || isPending}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Timeline */}
                <div className="space-y-1">
                  <h4 className="text-sm font-medium mb-4">Histórico</h4>
                  {isLoadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : history.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma atividade registrada.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {history.map((item, index) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              {ACTION_ICONS[item.action] || <Clock className="h-4 w-4" />}
                            </div>
                            {index < history.length - 1 && (
                              <div className="w-px h-full bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium">
                              {ACTION_LABELS[item.action] || item.action}
                            </p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {item.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(item.created_at).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
