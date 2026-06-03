'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  Send,
  Copy,
  ExternalLink,
  RefreshCw,
  Pencil,
  FileVideo,
  FileText,
  ImageIcon,
  Download,
  CalendarClock,
  User,
  Building2,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Dados mockados
// ---------------------------------------------------------------------------

const PRODUCTION = {
  title: 'Black Friday Temi Eletro',
  client: 'Temi Eletro',
  responsible: 'Igor Macêdo',
  postDate: '28 de novembro, 2025',
  status: 'Aprovação do Cliente',
  poster: '/producao/black-friday-temi-eletro.png',
  approvalLink: 'https://app.exemplo.com/aprovar/abc123',
}

const DEFAULT_CAPTION = `🔥 BLACK FRIDAY TEMI ELETRO chegou e os preços estão IMPERDÍVEIS!

Smart TVs, smartphones, eletrodomésticos e muito mais com até 70% OFF. 🛒

✅ Parcelamos em até 12x sem juros
✅ Frete grátis para toda a região
✅ Estoque limitado

Corre que é só até domingo! 🏃‍♀️💨

📍 Av. Principal, 1234 — Centro
📱 WhatsApp: (00) 0000-0000

#BlackFriday #TemiEletro #Ofertas #Eletrodomesticos`

type ChatMessage = {
  id: number
  author: string
  isAgency: boolean
  message: string
  time: string
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    author: 'Impulsionaí',
    isAgency: true,
    message: 'Vídeo enviado para aprovação. Qualquer ajuste é só avisar por aqui!',
    time: '09:14',
  },
  {
    id: 2,
    author: 'Cliente',
    isAgency: false,
    message: 'Ficou ótimo! Só peço para trocar a frase final do vídeo.',
    time: '10:32',
  },
  {
    id: 3,
    author: 'Impulsionaí',
    isAgency: true,
    message: 'Ajustado. Pode conferir a nova versão.',
    time: '11:05',
  },
]

const STATUS_OPTIONS = [
  { label: 'Enviar para Aprovação', value: 'Aprovação do Cliente', tone: 'primary' },
  { label: 'Aprovado', value: 'Aprovado', tone: 'success' },
  { label: 'Solicitou Ajuste', value: 'Solicitou Ajuste', tone: 'warning' },
  { label: 'Programado', value: 'Programado', tone: 'info' },
  { label: 'Publicado', value: 'Publicado', tone: 'muted' },
] as const

const STATUS_STYLES: Record<string, string> = {
  'Aprovação do Cliente': 'bg-warning/15 text-warning border-warning/30',
  Aprovado: 'bg-success/15 text-success border-success/30',
  'Solicitou Ajuste': 'bg-destructive/15 text-destructive border-destructive/30',
  Programado: 'bg-chart-2/15 text-chart-2 border-chart-2/30',
  Publicado: 'bg-primary/15 text-primary border-primary/30',
}

const FILES = [
  { name: 'video-final.mp4', size: '48,2 MB', icon: FileVideo, tint: 'text-chart-2' },
  { name: 'legenda.docx', size: '12 KB', icon: FileText, tint: 'text-chart-3' },
  { name: 'capa.jpg', size: '1,8 MB', icon: ImageIcon, tint: 'text-primary' },
]

const HISTORY = [
  { title: 'Produção criada', author: 'Igor Macêdo', time: '24 nov, 08:30', done: true },
  { title: 'Vídeo enviado', author: 'Impulsionaí', time: '24 nov, 09:14', done: true },
  { title: 'Cliente comentou', author: 'Temi Eletro', time: '24 nov, 10:32', done: true },
  { title: 'Ajuste realizado', author: 'Impulsionaí', time: '24 nov, 11:05', done: true },
  { title: 'Aguardando aprovação', author: 'Temi Eletro', time: 'Agora', done: false },
]

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export interface ContentApprovalData {
  title: string
  client: string
  responsible: string
  postDate: string
  caption: string
  poster: string | null
  videoName?: string
}

export function ContentApproval({ data }: { data?: ContentApprovalData }) {
  const production = data
    ? {
        title: data.title,
        client: data.client,
        responsible: data.responsible,
        postDate: data.postDate || 'A definir',
        status: 'Aprovação do Cliente',
        poster: data.poster || PRODUCTION.poster,
        approvalLink: PRODUCTION.approvalLink,
      }
    : PRODUCTION
  const initialCaption = data?.caption?.trim() ? data.caption : DEFAULT_CAPTION
  const isUploadedVideo = Boolean(
    data?.poster &&
      (data.poster.startsWith('blob:') || /\.(mp4|mov|webm)$/i.test(data.videoName || '')),
  )

  const [status, setStatus] = useState<string>(production.status)
  const [caption, setCaption] = useState(initialCaption)
  const [captionDraft, setCaptionDraft] = useState(initialCaption)
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [newMessage, setNewMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        author: 'Impulsionaí',
        isAgency: true,
        message: newMessage.trim(),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setNewMessage('')
  }

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(production.approvalLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const handleSaveCaption = () => {
    setCaption(captionDraft)
    setIsEditingCaption(false)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
      {/* ----------------------------- COLUNA ESQUERDA ----------------------------- */}
      <div className="space-y-6 lg:col-span-7">
        {/* Card Vídeo */}
        <Card className="overflow-hidden border-border bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-[300px] overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm">
                <div className="relative aspect-[9/16] w-full">
                  {isUploadedVideo ? (
                    <video
                      src={production.poster}
                      className="h-full w-full object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={production.poster || '/placeholder.svg'}
                        alt={`Capa do vídeo ${production.title}`}
                        className="h-full w-full object-cover"
                      />
                      {/* Botão play decorativo */}
                      <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                        <button
                          type="button"
                          aria-label="Reproduzir vídeo"
                          className="flex h-16 w-16 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm transition-transform hover:scale-105"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="ml-1 h-7 w-7 fill-foreground"
                            aria-hidden="true"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Metadados */}
            <div className="space-y-4">
              <div>
                <h2 className="text-balance text-xl font-semibold text-foreground">
                  {production.title}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MetaItem icon={Building2} label="Cliente" value={production.client} />
                <MetaItem icon={User} label="Responsável" value={production.responsible} />
                <MetaItem
                  icon={CalendarClock}
                  label="Data prevista de postagem"
                  value={production.postDate}
                />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      variant="outline"
                      className={cn('mt-1 font-medium', STATUS_STYLES[status])}
                    >
                      {status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Legenda */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">Legenda</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCaptionDraft(caption)
                setIsEditingCaption(true)
              }}
              className="gap-2"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar Legenda
            </Button>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap rounded-xl border border-border bg-secondary/40 p-4 text-sm leading-relaxed text-foreground">
              {caption}
            </div>
          </CardContent>
        </Card>

        {/* Card Comentários */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Comentários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[260px] pr-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex gap-3', msg.isAgency ? 'flex-row' : 'flex-row-reverse')}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback
                        className={cn(
                          'text-xs font-medium',
                          msg.isAgency
                            ? 'bg-primary/15 text-primary'
                            : 'bg-secondary text-secondary-foreground',
                        )}
                      >
                        {msg.isAgency ? 'IP' : 'CL'}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        'max-w-[80%] space-y-1',
                        msg.isAgency ? 'items-start' : 'items-end text-right',
                      )}
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{msg.author}</span>
                        <span>{msg.time}</span>
                      </div>
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                          msg.isAgency
                            ? 'rounded-tl-sm bg-secondary text-foreground'
                            : 'rounded-tr-sm bg-primary text-primary-foreground',
                        )}
                      >
                        {msg.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            <div className="flex items-end gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Adicionar comentário..."
                className="min-h-[44px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Button onClick={handleSendMessage} className="gap-2 shrink-0">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Enviar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------- COLUNA DIREITA ----------------------------- */}
      <div className="space-y-6 lg:col-span-3">
        <div className="space-y-6 lg:sticky lg:top-6">
          {/* Card Status */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border bg-secondary/40 p-4 text-center">
                <p className="text-xs text-muted-foreground">Status atual</p>
                <Badge
                  variant="outline"
                  className={cn('mt-2 text-sm font-medium', STATUS_STYLES[status])}
                >
                  {status}
                </Badge>
              </div>

              <div className="space-y-2">
                {STATUS_OPTIONS.map((option) => {
                  const isActive = status === option.value
                  return (
                    <Button
                      key={option.label}
                      variant={isActive ? 'default' : 'outline'}
                      className="w-full justify-start gap-2"
                      onClick={() => setStatus(option.value)}
                    >
                      {isActive && <CheckCircle2 className="h-4 w-4" />}
                      {option.label}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Card Link de Aprovação */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Link do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                readOnly
                value={production.approvalLink}
                className="bg-secondary/40 text-xs text-muted-foreground"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copiado!' : 'Copiar Link'}
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir Link
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                Gerar Novo Link
              </Button>
            </CardContent>
          </Card>

          {/* Card Arquivos */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Arquivos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {FILES.map((file) => {
                const Icon = file.icon
                return (
                  <div
                    key={file.name}
                    className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 transition-colors hover:bg-secondary"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                      <Icon className={cn('h-4 w-4', file.tint)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span className="sr-only">Baixar {file.name}</span>
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Card Histórico */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-5 border-l border-border pl-6">
                {HISTORY.map((item, index) => (
                  <li key={index} className="relative">
                    <span
                      className={cn(
                        'absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border-2',
                        item.done
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-warning bg-card text-warning',
                      )}
                    >
                      {item.done ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.author} · {item.time}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ----------------------------- DIALOG EDITAR LEGENDA ----------------------------- */}
      <Dialog open={isEditingCaption} onOpenChange={setIsEditingCaption}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Legenda</DialogTitle>
          </DialogHeader>
          <Textarea
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            className="min-h-[260px] resize-none text-sm leading-relaxed"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingCaption(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCaption}>Salvar Legenda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

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
