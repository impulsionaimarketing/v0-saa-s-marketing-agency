'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Video, ImageIcon, FileDown, Loader2, Download, AlertCircle } from 'lucide-react'
import { type VideoScript } from '@/lib/data/video-scripts'
import { type ArteBrief } from '@/lib/data/arte-briefs'
import { type MonthlyPlanning, updateMonthlyPlanningPdfUrl } from '@/lib/data/monthly-plannings'

interface ExportPdfSectionProps {
  planning: MonthlyPlanning
  videoScripts: VideoScript[]
  arteBriefs: ArteBrief[]
  clientName: string
  onPdfGenerated: (pdfUrl: string) => void
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const statusColors: Record<string, string> = {
  'Pendente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Em Andamento': 'bg-blue-100 text-blue-800 border-blue-200',
  'Em Revisão': 'bg-purple-100 text-purple-800 border-purple-200',
  'Aprovado': 'bg-green-100 text-green-800 border-green-200',
  'Cancelado': 'bg-red-100 text-red-800 border-red-200',
}

export function ExportPdfSection({ 
  planning, 
  videoScripts, 
  arteBriefs, 
  clientName,
  onPdfGenerated 
}: ExportPdfSectionProps) {
  const [selectedVideos, setSelectedVideos] = useState<string[]>([])
  const [selectedArtes, setSelectedArtes] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset selections when planning changes
  useEffect(() => {
    setSelectedVideos([])
    setSelectedArtes([])
    setError(null)
  }, [planning.id])

  const handleSelectAllVideos = (checked: boolean) => {
    if (checked) {
      setSelectedVideos(videoScripts.map(v => v.id))
    } else {
      setSelectedVideos([])
    }
  }

  const handleSelectAllArtes = (checked: boolean) => {
    if (checked) {
      setSelectedArtes(arteBriefs.map(a => a.id))
    } else {
      setSelectedArtes([])
    }
  }

  const toggleVideo = (id: string) => {
    setSelectedVideos(prev => 
      prev.includes(id) 
        ? prev.filter(v => v !== id)
        : [...prev, id]
    )
  }

  const toggleArte = (id: string) => {
    setSelectedArtes(prev => 
      prev.includes(id) 
        ? prev.filter(a => a !== id)
        : [...prev, id]
    )
  }

  const handleGeneratePdf = async () => {
    if (selectedVideos.length === 0 && selectedArtes.length === 0) {
      setError('Selecione pelo menos um item para exportar')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Build the payload
      const selectedVideoItems = videoScripts.filter(v => selectedVideos.includes(v.id))
      const selectedArteItems = arteBriefs.filter(a => selectedArtes.includes(a.id))

      const payload = {
        planning_id: planning.id,
        cliente: clientName,
        mes: MONTHS[planning.month - 1],
        ano: planning.year,
        itens: [
          ...selectedVideoItems.map(video => ({
            tipo: 'video',
            nome: video.name,
            formato: video.format || '',
            roteiro: video.script_text || '',
            responsavel: video.responsible_name || '',
            prazo: video.deadline || '',
            status: video.status
          })),
          ...selectedArteItems.map(arte => ({
            tipo: 'arte',
            nome: arte.name,
            formato: arte.format || '',
            descricao: arte.description || '',
            cores: arte.colors || '',
            elementos: arte.elements || '',
            responsavel: arte.responsible_name || '',
            prazo: arte.deadline || '',
            status: arte.status
          }))
        ]
      }

      // Send to webhook
      const response = await fetch('https://n8n.impulsionaimarketing.com.br/webhook/cronograma-gerarpdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Erro na resposta do servidor')
      }

      const result = await response.json()

      if (!result.pdf_url) {
        throw new Error('URL do PDF não retornada')
      }

      // Save the PDF URL to the database
      await updateMonthlyPlanningPdfUrl(planning.id, result.pdf_url)

      // Notify parent component
      onPdfGenerated(result.pdf_url)

    } catch (err) {
      console.error('[v0] Error generating PDF:', err)
      setError('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  const hasItems = videoScripts.length > 0 || arteBriefs.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Exportar PDF do Planejamento
            </CardTitle>
            <CardDescription>
              Selecione os itens que deseja incluir no PDF
            </CardDescription>
          </div>
          {planning.pdf_url && (
            <Button
              variant="outline"
              onClick={() => window.open(planning.pdf_url!, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasItems ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileDown className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p>Nenhum roteiro ou briefing disponivel para exportar.</p>
            <p className="text-sm mt-1">Crie itens primeiro na seção acima.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Videos Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-blue-500" />
                    <Label className="font-medium">Videos</Label>
                    <Badge variant="outline" className="ml-1">{videoScripts.length}</Badge>
                  </div>
                  {videoScripts.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all-videos"
                        checked={selectedVideos.length === videoScripts.length && videoScripts.length > 0}
                        onCheckedChange={handleSelectAllVideos}
                      />
                      <Label htmlFor="select-all-videos" className="text-sm cursor-pointer">
                        Selecionar todos
                      </Label>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {videoScripts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Nenhum video disponivel
                    </p>
                  ) : (
                    videoScripts.map(video => (
                      <div 
                        key={video.id}
                        className={`flex items-center gap-3 p-2 rounded-md border transition-colors ${
                          selectedVideos.includes(video.id) 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          id={`video-${video.id}`}
                          checked={selectedVideos.includes(video.id)}
                          onCheckedChange={() => toggleVideo(video.id)}
                        />
                        <Label 
                          htmlFor={`video-${video.id}`} 
                          className="flex-1 cursor-pointer text-sm"
                        >
                          {video.name}
                        </Label>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${statusColors[video.status] || ''}`}
                        >
                          {video.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Artes Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-pink-500" />
                    <Label className="font-medium">Artes</Label>
                    <Badge variant="outline" className="ml-1">{arteBriefs.length}</Badge>
                  </div>
                  {arteBriefs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all-artes"
                        checked={selectedArtes.length === arteBriefs.length && arteBriefs.length > 0}
                        onCheckedChange={handleSelectAllArtes}
                      />
                      <Label htmlFor="select-all-artes" className="text-sm cursor-pointer">
                        Selecionar todos
                      </Label>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {arteBriefs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Nenhuma arte disponivel
                    </p>
                  ) : (
                    arteBriefs.map(arte => (
                      <div 
                        key={arte.id}
                        className={`flex items-center gap-3 p-2 rounded-md border transition-colors ${
                          selectedArtes.includes(arte.id) 
                            ? 'border-pink-300 bg-pink-50' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          id={`arte-${arte.id}`}
                          checked={selectedArtes.includes(arte.id)}
                          onCheckedChange={() => toggleArte(arte.id)}
                        />
                        <Label 
                          htmlFor={`arte-${arte.id}`} 
                          className="flex-1 cursor-pointer text-sm"
                        >
                          {arte.name}
                        </Label>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${statusColors[arte.status] || ''}`}
                        >
                          {arte.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 rounded-md bg-destructive/10 text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Generate Button */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedVideos.length + selectedArtes.length} item(s) selecionado(s)
              </p>
              <Button 
                onClick={handleGeneratePdf}
                disabled={isGenerating || (selectedVideos.length === 0 && selectedArtes.length === 0)}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Gerar PDF
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
