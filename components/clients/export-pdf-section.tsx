'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Video, ImageIcon, FileDown, Loader2, Download, AlertCircle, Calendar } from 'lucide-react'
import { type VideoScript } from '@/lib/data/video-scripts'
import { type ArteBrief } from '@/lib/data/arte-briefs'
import { type MonthlyPlanning, updateMonthlyPlanningPdfUrl } from '@/lib/data/monthly-plannings'

interface ExportPdfSectionProps {
  plannings: MonthlyPlanning[]
  selectedMonth: number | null
  selectedYear: number | null
  videoScripts: VideoScript[]
  arteBriefs: ArteBrief[]
  clientName: string
  onMonthChange: (month: number, year: number) => void
  onPdfGenerated: (planningId: string, pdfUrl: string) => void
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
  plannings,
  selectedMonth,
  selectedYear,
  videoScripts, 
  arteBriefs, 
  clientName,
  onMonthChange,
  onPdfGenerated 
}: ExportPdfSectionProps) {
  const [selectedVideos, setSelectedVideos] = useState<string[]>([])
  const [selectedArtes, setSelectedArtes] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get current selected planning
  const selectedPlanning = plannings.find(
    p => p.month === selectedMonth && p.year === selectedYear
  )

  // Reset selections when planning changes
  useEffect(() => {
    setSelectedVideos([])
    setSelectedArtes([])
    setError(null)
  }, [selectedMonth, selectedYear])

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
    if (!selectedPlanning) {
      setError('Selecione um mes primeiro')
      return
    }

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
        planning_id: selectedPlanning.id,
        cliente: clientName,
        mes: MONTHS[selectedPlanning.month - 1],
        ano: selectedPlanning.year,
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

      // Send to webhook with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch('https://n8n.impulsionaimarketing.com.br/webhook/cronograma-gerarpdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro do servidor (${response.status}): ${errorText || 'Resposta invalida'}`)
      }

      let result
      try {
        result = await response.json()
      } catch (parseError) {
        throw new Error('Resposta invalida do servidor')
      }

      if (!result.pdf_url) {
        throw new Error('Servidor nao retornou URL do PDF')
      }

      const pdfUrl = result.pdf_url

      // Open PDF in new tab immediately
      window.open(pdfUrl, '_blank')

      // Try to save the PDF URL to the database (don't fail if this errors)
      try {
        await updateMonthlyPlanningPdfUrl(selectedPlanning.id, pdfUrl)
        onPdfGenerated(selectedPlanning.id, pdfUrl)
      } catch (dbError) {
        console.error('[v0] Error saving PDF URL to database:', dbError)
        // Still consider it a success since the PDF was generated
        onPdfGenerated(selectedPlanning.id, pdfUrl)
      }
      
      setError(null)

    } catch (err) {
      console.error('[v0] Error generating PDF:', err)
      
      let errorMessage = 'Erro ao gerar PDF. Tente novamente.'
      
      if (err instanceof TypeError) {
        if (err.message.includes('AbortError') || err.name === 'AbortError') {
          errorMessage = 'Requisicao expirou. A geracao demorou muito. Tente novamente.'
        } else if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
          errorMessage = 'Erro de conexao. Verifique sua internet e tente novamente.'
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const hasItems = videoScripts.length > 0 || arteBriefs.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Exportar PDF do Planejamento
            </CardTitle>
            <CardDescription>
              Selecione o mes e os itens para gerar o PDF
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                className="px-3 py-2 border rounded-md bg-background text-sm"
                value={selectedMonth && selectedYear ? `${selectedMonth}-${selectedYear}` : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const [month, year] = e.target.value.split('-').map(Number)
                    onMonthChange(month, year)
                  }
                }}
              >
                <option value="">Selecione o mes</option>
                {plannings.map((planning) => (
                  <option key={planning.id} value={`${planning.month}-${planning.year}`}>
                    {MONTHS[planning.month - 1]} {planning.year}
                  </option>
                ))}
              </select>
            </div>
            {selectedPlanning?.pdf_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(selectedPlanning.pdf_url!, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedMonth || !selectedYear ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p>Selecione um mes acima para visualizar os itens disponiveis.</p>
          </div>
        ) : !hasItems ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileDown className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p>Nenhum roteiro ou briefing disponivel para {MONTHS[selectedMonth - 1]} {selectedYear}.</p>
            <p className="text-sm mt-1">Crie itens primeiro na secao de Roteiros e Briefings acima.</p>
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
              <div className="mt-4 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive space-y-2">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Erro ao gerar PDF</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
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
