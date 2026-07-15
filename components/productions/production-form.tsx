'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  UploadCloud,
  FileVideo,
  Image as ImageIcon,
  X,
  Building2,
  User,
  CalendarClock,
  Link2,
  Type,
  Send,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { getClients, type Client } from '@/lib/data/clients'
import { getUsers, type User as AppUser } from '@/lib/data/users'

export interface ProductionFormData {
  title: string
  clientId: string
  client: string
  responsibleId: string
  responsible: string
  type: 'Vídeo' | 'Arte'
  postDate: string
  caption: string
  referenceUrl: string
  videoName: string
  videoPreview: string | null
  file: File | null
  coverFile: File | null
  coverPreview: string | null
}

export function ProductionForm({
  onSubmit,
  isSubmitting = false,
}: {
  onSubmit: (data: ProductionFormData) => void
  isSubmitting?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [videoName, setVideoName] = useState<string>('')
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [coverName, setCoverName] = useState<string>('')
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [title, setTitle] = useState('')
  const [client, setClient] = useState('')
  const [responsible, setResponsible] = useState('')
  const [type, setType] = useState<'Vídeo' | 'Arte'>('Vídeo')
  const [postDate, setPostDate] = useState('')
  const [caption, setCaption] = useState('')
  const [referenceUrl, setReferenceUrl] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getClients({ status: 'Ativo' }), getUsers({ status: 'Ativo' })])
      .then(([clientsData, usersData]) => {
        if (!active) return
        setClients(clientsData)
        setUsers(usersData)
      })
      .catch((err) => console.error('[v0] Error loading form data:', err))
      .finally(() => {
        if (active) setLoadingData(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleFile = (file: File | undefined) => {
    if (!file) return
    setSelectedFile(file)
    setVideoName(file.name)
    if (file.type.startsWith('video/') || file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setVideoPreview(url)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const clearFile = () => {
    setVideoName('')
    setVideoPreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCover = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    setCoverFile(file)
    setCoverName(file.name)
    setCoverPreview(URL.createObjectURL(file))
  }

  const clearCover = () => {
    setCoverName('')
    setCoverPreview(null)
    setCoverFile(null)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  const isValid = title.trim() && client && responsible && videoName

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    const clientName = clients.find((c) => c.id === client)?.name || ''
    const responsibleName = users.find((u) => u.id === responsible)?.name || ''
    onSubmit({
      title: title.trim(),
      clientId: client,
      client: clientName,
      responsibleId: responsible,
      responsible: responsibleName,
      type,
      postDate,
      caption: caption.trim(),
      referenceUrl: referenceUrl.trim(),
      videoName,
      videoPreview,
      file: selectedFile,
      coverFile: type === 'Vídeo' ? coverFile : null,
      coverPreview: type === 'Vídeo' ? coverPreview : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-10">
      {/* ----------------------------- COLUNA ESQUERDA: UPLOAD ----------------------------- */}
      <div className="space-y-6 lg:col-span-4">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileVideo className="h-4 w-4 text-muted-foreground" />
              Vídeo / Arte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {!videoPreview && !videoName && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  'flex aspect-[9/16] w-full max-w-[300px] mx-auto flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors',
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-secondary/40 hover:border-primary/50 hover:bg-secondary',
                )}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Arraste o vídeo aqui
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ou clique para selecionar
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">MP4, MOV ou imagem · até 100 MB</p>
              </button>
            )}

            {(videoPreview || videoName) && (
              <div className="space-y-3">
                <div className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl border border-border bg-secondary">
                  <div className="relative aspect-[9/16] w-full">
                    {videoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <video
                        src={videoPreview}
                        className="h-full w-full object-cover"
                        controls
                        playsInline
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                        <FileVideo className="h-10 w-10" />
                        <span className="text-xs">Pré-visualização indisponível</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    aria-label="Remover arquivo"
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileVideo className="h-4 w-4 shrink-0 text-chart-2" />
                    <span className="truncate text-sm text-foreground">{videoName}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Trocar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* -------------------------- CAPA DO REELS (só vídeo) -------------------------- */}
        {type === 'Vídeo' && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Capa do Reels (opcional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleCover(e.target.files?.[0])}
              />

              {!coverPreview ? (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="flex aspect-[9/16] w-full max-w-[300px] mx-auto flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-6 text-center transition-colors hover:border-primary/50 hover:bg-secondary"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ImageIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Adicionar capa
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Imagem exibida como thumbnail do reels
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">JPG ou PNG</p>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl border border-border bg-secondary">
                    <div className="relative aspect-[9/16] w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverPreview || '/placeholder.svg'}
                        alt="Pré-visualização da capa"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={clearCover}
                      aria-label="Remover capa"
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <ImageIcon className="h-4 w-4 shrink-0 text-chart-2" />
                      <span className="truncate text-sm text-foreground">{coverName}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => coverInputRef.current?.click()}
                    >
                      Trocar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ----------------------------- COLUNA DIREITA: DADOS ----------------------------- */}
      <div className="space-y-6 lg:col-span-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              Informações da Produção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <Type className="h-3.5 w-3.5 text-muted-foreground" />
                Título
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Black Friday Temi Eletro"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Cliente
                </Label>
                <Select value={client} onValueChange={setClient} disabled={loadingData}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? 'Carregando...' : 'Selecione o cliente'} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Responsável
                </Label>
                <Select value={responsible} onValueChange={setResponsible} disabled={loadingData}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? 'Carregando...' : 'Selecione o responsável'} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  Tipo
                </Label>
                <Select value={type} onValueChange={(v) => setType(v as 'Vídeo' | 'Arte')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vídeo">Vídeo</SelectItem>
                    <SelectItem value="Arte">Arte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postDate" className="flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                  Data de postagem
                </Label>
                <Input
                  id="postDate"
                  type="date"
                  value={postDate}
                  onChange={(e) => setPostDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceUrl" className="flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                Link de referência (opcional)
              </Label>
              <Input
                id="referenceUrl"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Legenda</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Escreva a legenda da publicação..."
                className="min-h-[160px] resize-none leading-relaxed"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="submit" disabled={!isValid || isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSubmitting ? 'Salvando...' : 'Enviar para Aprovação'}
          </Button>
        </div>
        {!isValid && (
          <p className="text-right text-xs text-muted-foreground">
            Preencha título, cliente, responsável e adicione um arquivo para continuar.
          </p>
        )}
      </div>
    </form>
  )
}
