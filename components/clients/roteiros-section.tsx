'use client'

import React from "react"

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  getVideoScripts, 
  createVideoScript, 
  updateVideoScript, 
  deleteVideoScript,
  convertVideoScriptToDemand,
  type VideoScript 
} from '@/lib/data/video-scripts'
import { 
  getArteBriefs, 
  createArteBrief, 
  updateArteBrief, 
  deleteArteBrief,
  convertArteBriefToDemand,
  type ArteBrief 
} from '@/lib/data/arte-briefs'
import { getUsers, type User } from '@/lib/data/users'
import { Video, ImageIcon, Plus, Trash2, Edit, Check, Calendar as CalendarIcon } from 'lucide-react'

interface RoteirosSectionProps {
  clientId: string
  month?: number | null
  year?: number | null
}

export function RoteirosSection({ clientId, month, year }: RoteirosSectionProps) {
  const [videoScripts, setVideoScripts] = useState<VideoScript[]>([])
  const [arteBriefs, setArteBriefs] = useState<ArteBrief[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoScript | null>(null)
  const [selectedArte, setSelectedArte] = useState<ArteBrief | null>(null)
  const [isAddingVideo, setIsAddingVideo] = useState(false)
  const [isAddingArte, setIsAddingArte] = useState(false)
  const [isPending, startTransition] = useTransition()

  const loadData = () => {
    startTransition(async () => {
      const [videos, artes, usersData] = await Promise.all([
        getVideoScripts(clientId, month ?? undefined, year ?? undefined),
        getArteBriefs(clientId, month ?? undefined, year ?? undefined),
        getUsers(),
      ])
      setVideoScripts(videos)
      setArteBriefs(artes)
      setUsers(usersData)
    })
  }

  useEffect(() => {
    loadData()
  }, [clientId, month, year])

  const handleCreateVideo = async (data: any) => {
    await createVideoScript({ ...data, client_id: clientId })
    loadData()
    setIsAddingVideo(false)
  }

  const handleUpdateVideo = async (id: string, data: any) => {
    await updateVideoScript(id, data)
    loadData()
    setSelectedVideo(null)
  }

  const handleDeleteVideo = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este roteiro?')) {
      await deleteVideoScript(id)
      loadData()
      setSelectedVideo(null)
    }
  }

  const handleConvertVideoToDemand = async (id: string) => {
    try {
      console.log('[v0] Converting video script to demand:', id, clientId)
      const demandId = await convertVideoScriptToDemand(id, clientId)
      console.log('[v0] Video converted to demand successfully. Demand ID:', demandId)
      loadData()
      setSelectedVideo(null)
    } catch (error) {
      console.error('[v0] Error converting video to demand:', error)
      alert('Erro ao converter roteiro em demanda')
    }
  }

  const handleCreateArte = async (data: any) => {
    await createArteBrief({ ...data, client_id: clientId })
    loadData()
    setIsAddingArte(false)
  }

  const handleUpdateArte = async (id: string, data: any) => {
    await updateArteBrief(id, data)
    loadData()
    setSelectedArte(null)
  }

  const handleDeleteArte = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este briefing?')) {
      await deleteArteBrief(id)
      loadData()
      setSelectedArte(null)
    }
  }

  const handleConvertArteToDemand = async (id: string) => {
    try {
      console.log('[v0] Converting arte brief to demand:', id, clientId)
      const demandId = await convertArteBriefToDemand(id, clientId)
      console.log('[v0] Arte converted to demand successfully. Demand ID:', demandId)
      loadData()
      setSelectedArte(null)
    } catch (error) {
      console.error('[v0] Error converting arte to demand:', error)
      alert('Erro ao converter briefing em demanda')
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="videos">Roteiros de Vídeos</TabsTrigger>
          <TabsTrigger value="artes">Briefings de Artes</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Roteiros de Vídeos</h3>
            <Button onClick={() => setIsAddingVideo(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Roteiro
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videoScripts.map((video) => (
              <Card 
                key={video.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedVideo(video)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Video className="h-5 w-5 text-blue-500 shrink-0" />
                      <CardTitle className="text-base line-clamp-2">{video.name}</CardTitle>
                    </div>
                    {video.is_converted_to_demand && (
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        <Check className="h-3 w-3 mr-1" />
                        Demanda
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {video.format && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Formato:</strong> {video.format}
                    </div>
                  )}
                  {video.responsible_name && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Responsável:</strong> {video.responsible_name}
                    </div>
                  )}
                  {video.deadline && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CalendarIcon className="h-3 w-3" />
                      {new Date(video.deadline).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  <Badge variant="outline">{video.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {videoScripts.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum roteiro criado ainda</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="artes" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Briefings de Artes</h3>
            <Button onClick={() => setIsAddingArte(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Briefing
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {arteBriefs.map((arte) => (
              <Card 
                key={arte.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedArte(arte)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <ImageIcon className="h-5 w-5 text-pink-500 shrink-0" />
                      <CardTitle className="text-base line-clamp-2">{arte.name}</CardTitle>
                    </div>
                    {arte.is_converted_to_demand && (
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        <Check className="h-3 w-3 mr-1" />
                        Demanda
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {arte.format && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Formato:</strong> {arte.format}
                    </div>
                  )}
                  {arte.responsible_name && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Responsável:</strong> {arte.responsible_name}
                    </div>
                  )}
                  {arte.deadline && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CalendarIcon className="h-3 w-3" />
                      {new Date(arte.deadline).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  <Badge variant="outline">{arte.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {arteBriefs.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum briefing criado ainda</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Video Script Dialog */}
      <VideoScriptDialog
        video={selectedVideo}
        isOpen={!!selectedVideo || isAddingVideo}
        onClose={() => {
          setSelectedVideo(null)
          setIsAddingVideo(false)
        }}
        onCreate={handleCreateVideo}
        onUpdate={handleUpdateVideo}
        onDelete={handleDeleteVideo}
        onConvert={handleConvertVideoToDemand}
        users={users}
      />

      {/* Arte Brief Dialog */}
      <ArteBriefDialog
        arte={selectedArte}
        isOpen={!!selectedArte || isAddingArte}
        onClose={() => {
          setSelectedArte(null)
          setIsAddingArte(false)
        }}
        onCreate={handleCreateArte}
        onUpdate={handleUpdateArte}
        onDelete={handleDeleteArte}
        onConvert={handleConvertArteToDemand}
        users={users}
      />
    </div>
  )
}

function VideoScriptDialog({ video, isOpen, onClose, onCreate, onUpdate, onDelete, onConvert, users }: any) {
  const [formData, setFormData] = useState({
    name: '',
    format: '',
    reference_links: '',
    script_text: '',
    responsible_id: '',
    deadline: '',
  })

  useEffect(() => {
    if (video) {
      setFormData({
        name: video.name || '',
        format: video.format || '',
        reference_links: video.reference_links || '',
        script_text: video.script_text || '',
        responsible_id: video.responsible_id || '',
        deadline: video.deadline || '',
      })
    } else {
      setFormData({
        name: '',
        format: '',
        reference_links: '',
        script_text: '',
        responsible_id: '',
        deadline: '',
      })
    }
  }, [video])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (video) {
      onUpdate(video.id, formData)
    } else {
      onCreate(formData)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{video ? 'Editar Roteiro de Vídeo' : 'Novo Roteiro de Vídeo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Vídeo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="format">Formato</Label>
            <Input
              id="format"
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              placeholder="Ex: Reels, Stories, Feed, YouTube"
            />
          </div>

          <div>
            <Label htmlFor="reference_links">Links de Referência</Label>
            <Textarea
              id="reference_links"
              value={formData.reference_links}
              onChange={(e) => setFormData({ ...formData, reference_links: e.target.value })}
              placeholder="Cole os links de referência aqui"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="script_text">Roteiro/Texto</Label>
            <Textarea
              id="script_text"
              value={formData.script_text}
              onChange={(e) => setFormData({ ...formData, script_text: e.target.value })}
              placeholder="Escreva o roteiro do vídeo aqui"
              rows={8}
            />
          </div>

          <div>
            <Label htmlFor="responsible_id">Responsável</Label>
            <Select
              value={formData.responsible_id}
              onValueChange={(value) => setFormData({ ...formData, responsible_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar responsável" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user: User) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="deadline">Prazo</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {video ? 'Salvar Alterações' : 'Criar Roteiro'}
            </Button>
            {video && !video.is_converted_to_demand && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onConvert(video.id)}
              >
                <Check className="h-4 w-4 mr-2" />
                Converter em Demanda
              </Button>
            )}
            {video && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(video.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ArteBriefDialog({ arte, isOpen, onClose, onCreate, onUpdate, onDelete, onConvert, users }: any) {
  const [formData, setFormData] = useState({
    name: '',
    format: '',
    reference_links: '',
    description: '',
    colors: '',
    elements: '',
    responsible_id: '',
    deadline: '',
  })

  useEffect(() => {
    if (arte) {
      setFormData({
        name: arte.name || '',
        format: arte.format || '',
        reference_links: arte.reference_links || '',
        description: arte.description || '',
        colors: arte.colors || '',
        elements: arte.elements || '',
        responsible_id: arte.responsible_id || '',
        deadline: arte.deadline || '',
      })
    } else {
      setFormData({
        name: '',
        format: '',
        reference_links: '',
        description: '',
        colors: '',
        elements: '',
        responsible_id: '',
        deadline: '',
      })
    }
  }, [arte])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (arte) {
      onUpdate(arte.id, formData)
    } else {
      onCreate(formData)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{arte ? 'Editar Briefing de Arte' : 'Novo Briefing de Arte'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Arte *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="format">Formato</Label>
            <Input
              id="format"
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              placeholder="Ex: Feed 1:1, Stories 9:16, Banner"
            />
          </div>

          <div>
            <Label htmlFor="reference_links">Links de Referência</Label>
            <Textarea
              id="reference_links"
              value={formData.reference_links}
              onChange={(e) => setFormData({ ...formData, reference_links: e.target.value })}
              placeholder="Cole os links de referência aqui"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição/Briefing</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o que deve conter na arte"
              rows={5}
            />
          </div>

          <div>
            <Label htmlFor="colors">Cores</Label>
            <Input
              id="colors"
              value={formData.colors}
              onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
              placeholder="Ex: Azul, Verde, Branco"
            />
          </div>

          <div>
            <Label htmlFor="elements">Elementos</Label>
            <Input
              id="elements"
              value={formData.elements}
              onChange={(e) => setFormData({ ...formData, elements: e.target.value })}
              placeholder="Ex: Logo, Foto do produto, CTA"
            />
          </div>

          <div>
            <Label htmlFor="responsible_id">Responsável</Label>
            <Select
              value={formData.responsible_id}
              onValueChange={(value) => setFormData({ ...formData, responsible_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar responsável" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user: User) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="deadline">Prazo</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {arte ? 'Salvar Alterações' : 'Criar Briefing'}
            </Button>
            {arte && !arte.is_converted_to_demand && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onConvert(arte.id)}
              >
                <Check className="h-4 w-4 mr-2" />
                Converter em Demanda
              </Button>
            )}
            {arte && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(arte.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
