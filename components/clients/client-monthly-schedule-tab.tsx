'use client'

import React from "react"
import { MonthlyPlanningItem } from '@/lib/data/monthly-plannings' // Import MonthlyPlanningItem
import { updatePlanningItem, convertItemToDemand, deletePlanningItem } from '@/lib/data/planning-items' // Import updatePlanningItem, convertItemToDemand, deletePlanningItem
import { handleViewDetails } from '@/lib/data/handle-view-details' // Declare the variable before using it

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  getMonthlyPlanningsByClient, 
  upsertMonthlyPlanning,
  deleteMonthlyPlanning,
  type MonthlyPlanning
} from '@/lib/data/monthly-plannings'
import { createVideoScript, deleteAllVideoScriptsByClient } from '@/lib/data/video-scripts'
import { createArteBrief, deleteAllArteBriefsByClient } from '@/lib/data/arte-briefs'
import { Calendar, Plus, Trash2, Video, ImageIcon, DollarSign, Check, Pencil, Download } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { RoteirosSection } from './roteiros-section'
import { ExportPdfSection } from './export-pdf-section'
import { getVideoScripts, type VideoScript } from '@/lib/data/video-scripts'
import { getArteBriefs, type ArteBrief } from '@/lib/data/arte-briefs'
import { getClientById } from '@/lib/data/clients'

interface ClientMonthlyScheduleTabProps {
  clientId: string
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function ClientMonthlyScheduleTab({ clientId }: ClientMonthlyScheduleTabProps) {
  const [plannings, setPlannings] = useState<MonthlyPlanning[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [videoScripts, setVideoScripts] = useState<VideoScript[]>([])
  const [arteBriefs, setArteBriefs] = useState<ArteBrief[]>([])
  const [clientName, setClientName] = useState<string>('')

  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    videos_qty: 0,
    artes_qty: 0,
    trafego_budget: 0,
  })

  const loadData = () => {
    startTransition(async () => {
      const data = await getMonthlyPlanningsByClient(clientId)
      setPlannings(data)
    })
  }

  const loadExportData = async () => {
    if (selectedMonth && selectedYear) {
      const [videos, artes] = await Promise.all([
        getVideoScripts(clientId, selectedMonth, selectedYear),
        getArteBriefs(clientId, selectedMonth, selectedYear)
      ])
      setVideoScripts(videos)
      setArteBriefs(artes)
    } else {
      setVideoScripts([])
      setArteBriefs([])
    }
  }

  const loadClientName = async () => {
    const client = await getClientById(clientId)
    if (client) {
      setClientName(client.name)
    }
  }

  useEffect(() => {
    loadData()
    loadClientName()
  }, [clientId])

  useEffect(() => {
    loadExportData()
  }, [selectedMonth, selectedYear, clientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await upsertMonthlyPlanning({
        client_id: clientId,
        ...formData,
      })
      setIsAddingNew(false)
      setFormData({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        videos_qty: 0,
        artes_qty: 0,
        trafego_budget: 0,
      })
      loadData()
    } catch (error) {
      console.error('[v0] Error saving planning:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cronograma e todos os roteiros/briefings associados?')) return
    try {
      // Delete all video scripts and arte briefs for this client
      await Promise.all([
        deleteAllVideoScriptsByClient(clientId),
        deleteAllArteBriefsByClient(clientId)
      ])
      
      // Then delete the planning
      await deleteMonthlyPlanning(id)
      loadData()
    } catch (error) {
      console.error('[v0] Error deleting planning:', error)
    }
  }

  const generateItems = async (planning: MonthlyPlanning) => {
    try {
      // Create video scripts directly with month and year
      for (let i = 0; i < planning.videos_qty; i++) {
        await createVideoScript({
          client_id: clientId,
          name: `Vídeo ${i + 1}`,
          month: planning.month,
          year: planning.year,
        })
      }
      
      // Create arte briefs directly with month and year
      for (let i = 0; i < planning.artes_qty; i++) {
        await createArteBrief({
          client_id: clientId,
          name: `Arte ${i + 1}`,
          month: planning.month,
          year: planning.year,
        })
      }
      
      loadData()
    } catch (error) {
      console.error('[v0] Error generating items:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cronograma Mensal</h2>
          <p className="text-muted-foreground">Gerencie o planejamento mensal de entregas</p>
        </div>
        <Button onClick={() => setIsAddingNew(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Mês
        </Button>
      </div>

      {/* Add New Planning Form */}
      {isAddingNew && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Cronograma</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mês</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                  >
                    {MONTHS.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Ano</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantidade de Vídeos</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.videos_qty}
                    onChange={(e) => setFormData({ ...formData, videos_qty: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Quantidade de Artes</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.artes_qty}
                    onChange={(e) => setFormData({ ...formData, artes_qty: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label>Orçamento de Tráfego (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.trafego_budget}
                  onChange={(e) => setFormData({ ...formData, trafego_budget: Number(e.target.value) })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Salvar</Button>
                <Button type="button" variant="outline" onClick={() => setIsAddingNew(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Plannings List */}
      <div className="grid gap-4">
        {plannings.map((planning) => (
          <Card key={planning.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {MONTHS[planning.month - 1]} {planning.year}
                </CardTitle>
              </div>
              <div className="flex gap-2">
                {planning.pdf_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(planning.pdf_url!, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateItems(planning)}
                >
                  Gerar Cards
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(planning.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Vídeos</p>
                  <p className="text-2xl font-bold">{planning.videos_qty}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Artes</p>
                  <p className="text-2xl font-bold">{planning.artes_qty}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Orçamento Tráfego</p>
                  <p className="text-2xl font-bold">
                    R$ {planning.trafego_budget.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roteiros Section */}
      <div className="mt-8 pt-8 border-t border-border">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Roteiros e Briefings</h3>
          <div className="flex gap-4 items-center">
            <select
              className="px-3 py-2 border rounded-md"
              value={selectedMonth && selectedYear ? `${selectedMonth}-${selectedYear}` : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const [month, year] = e.target.value.split('-').map(Number)
                  setSelectedMonth(month)
                  setSelectedYear(year)
                } else {
                  setSelectedMonth(null)
                  setSelectedYear(null)
                }
              }}
            >
              <option value="">Todos os meses</option>
              {plannings.map((planning) => (
                <option key={planning.id} value={`${planning.month}-${planning.year}`}>
                  {new Date(planning.year, planning.month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>
        </div>
        <RoteirosSection 
          clientId={clientId} 
          month={selectedMonth} 
          year={selectedYear}
        />
      </div>

      {/* Export PDF Section */}
      {selectedMonth && selectedYear && (
        <div className="mt-8 pt-8 border-t border-border">
          {(() => {
            const selectedPlanning = plannings.find(
              p => p.month === selectedMonth && p.year === selectedYear
            )
            if (!selectedPlanning) return null
            
            return (
              <ExportPdfSection
                planning={selectedPlanning}
                videoScripts={videoScripts}
                arteBriefs={arteBriefs}
                clientName={clientName}
                onPdfGenerated={(pdfUrl) => {
                  // Update the local planning state with the new pdf_url
                  setPlannings(prev => prev.map(p => 
                    p.id === selectedPlanning.id 
                      ? { ...p, pdf_url: pdfUrl }
                      : p
                  ))
                  loadExportData()
                }}
              />
            )
          })()}
        </div>
      )}
    </div>
  )
}
