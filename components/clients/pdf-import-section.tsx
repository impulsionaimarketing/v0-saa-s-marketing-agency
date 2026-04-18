'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface PDFImportSectionProps {
  clientId: string
  clientName: string
  month: number
  year: number
  onSuccess: () => void
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
  })

export function PDFImportSection({
  clientId,
  clientName,
  month,
  year,
  onSuccess,
}: PDFImportSectionProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
    } else {
      toast.error('Por favor, selecione um arquivo PDF válido')
      setFile(null)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile)
    } else {
      toast.error('Por favor, solte um arquivo PDF válido')
    }
  }

  const handleProcessPDF = async () => {
    if (!file) {
      toast.error('Por favor, selecione um arquivo PDF')
      return
    }

    try {
      setIsLoading(true)
      const pdfBase64 = await toBase64(file)

      const response = await fetch(
        'https://n8n.impulsionaimarketing.com.br/webhook/cronograma-importarpdf',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_name: clientName,
            month,
            year,
            pdf_base64: pdfBase64,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ao processar PDF: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('[v0] PDF processing result:', result)

      toast.success(result.resumo || 'PDF processado com sucesso!')
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onSuccess()
    } catch (error) {
      console.error('[v0] Error processing PDF:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erro ao processar o PDF'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Importar Planejamento via PDF
        </CardTitle>
        <CardDescription>
          Carregue um PDF para importar roteiros e demandas automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">
            {file ? file.name : 'Arraste um PDF aqui ou clique para selecionar'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Formato: PDF apenas
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Mês</Label>
            <p className="font-medium">
              {new Date(year, month - 1).toLocaleDateString('pt-BR', {
                month: 'long',
              })}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Ano</Label>
            <p className="font-medium">{year}</p>
          </div>
        </div>

        <Button
          onClick={handleProcessPDF}
          disabled={!file || isLoading}
          className="w-full"
        >
          {isLoading ? 'Analisando PDF...' : 'Processar PDF'}
        </Button>
      </CardContent>
    </Card>
  )
}
