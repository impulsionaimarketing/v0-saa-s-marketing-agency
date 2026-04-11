'use client'

import React from "react"

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Video, ImageIcon, Plus } from 'lucide-react'
import { VideoScriptRow } from './video-script-row'
import { ArteBriefRow } from './arte-brief-row'
import { CreateVideoScriptDialog } from './create-video-script-dialog'
import { CreateArteBriefDialog } from './create-arte-brief-dialog'

interface RoteirosSectionProps {
  clientId: string
  month?: number | null
  year?: number | null
}

export function RoteirosSection({ clientId, month, year }: RoteirosSectionProps) {
  const [videoScripts, setVideoScripts] = useState<VideoScript[]>([])
  const [arteBriefs, setArteBriefs] = useState<ArteBrief[]>([])
  const [users, setUsers] = useState<User[]>([])
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
  }

  const handleDeleteVideo = async (id: string) => {
    await deleteVideoScript(id)
    loadData()
  }

  const handleConvertVideoToDemand = async (id: string) => {
    try {
      console.log('[v0] Converting video script to demand:', id, clientId)
      const demandId = await convertVideoScriptToDemand(id, clientId)
      console.log('[v0] Video converted to demand successfully. Demand ID:', demandId)
      loadData()
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
  }

  const handleDeleteArte = async (id: string) => {
    await deleteArteBrief(id)
    loadData()
  }

  const handleConvertArteToDemand = async (id: string) => {
    try {
      console.log('[v0] Converting arte brief to demand:', id, clientId)
      const demandId = await convertArteBriefToDemand(id, clientId)
      console.log('[v0] Arte converted to demand successfully. Demand ID:', demandId)
      loadData()
    } catch (error) {
      console.error('[v0] Error converting arte to demand:', error)
      alert('Erro ao converter briefing em demanda')
    }
  }

  return (
    <div className="space-y-8">
      {/* Videos Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Roteiros de Vídeos</h3>
            <Badge variant="outline" className="ml-1">{videoScripts.length}</Badge>
          </div>
          <Button 
            onClick={() => setIsAddingVideo(true)} 
            size="sm"
            disabled={isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Roteiro
          </Button>
        </div>

        <div className="space-y-2">
          {videoScripts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>Nenhum roteiro criado ainda</p>
            </div>
          ) : (
            videoScripts.map((video) => (
              <VideoScriptRow
                key={video.id}
                video={video}
                users={users}
                onUpdate={handleUpdateVideo}
                onDelete={handleDeleteVideo}
                onConvert={handleConvertVideoToDemand}
              />
            ))
          )}
        </div>
      </div>

      {/* Artes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-pink-500" />
            <h3 className="text-lg font-semibold">Briefings de Artes</h3>
            <Badge variant="outline" className="ml-1">{arteBriefs.length}</Badge>
          </div>
          <Button 
            onClick={() => setIsAddingArte(true)} 
            size="sm"
            disabled={isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Briefing
          </Button>
        </div>

        <div className="space-y-2">
          {arteBriefs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>Nenhum briefing criado ainda</p>
            </div>
          ) : (
            arteBriefs.map((arte) => (
              <ArteBriefRow
                key={arte.id}
                arte={arte}
                users={users}
                onUpdate={handleUpdateArte}
                onDelete={handleDeleteArte}
                onConvert={handleConvertArteToDemand}
              />
            ))
          )}
        </div>
      </div>

      {/* Video Script Dialog - Create Only */}
      <CreateVideoScriptDialog
        isOpen={isAddingVideo}
        onClose={() => setIsAddingVideo(false)}
        onCreate={handleCreateVideo}
        users={users}
      />

      {/* Arte Brief Dialog - Create Only */}
      <CreateArteBriefDialog
        isOpen={isAddingArte}
        onClose={() => setIsAddingArte(false)}
        onCreate={handleCreateArte}
        users={users}
      />
    </div>
  )
}
