'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
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
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [convertToDemand, setConvertToDemand] = useState<boolean | null>(null)
  const [result, setResult] = useState<'success' | 'error' | null>(null)
  const [resumo, setResumo] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (result === 'success') {
      const timer = setTimeout(() => {
        router.refresh()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [result, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setConvertToDemand(null) // Reset conversion choice when new file is selected
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
      setConvertToDemand(null) // Reset conversion choice when new file is selected
    } else {
      toast.error('Por favor, solte um arquivo PDF válido')
    }
  }

  const handleProcessPDF = async () => {
    if (!file) {
      toast.error('Por favor, selecione um arquivo PDF')
      return
    }

    if (convertToDemand === null) {
      toast.error('Por favor, selecione uma opção de conversão')
      return
    }

    try {
      setIsLoading(true)
      setResult(null)
      const pdfBase64 = await toBase64(file)

      const response = await fetch('/api/pdf-import', {
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
          convert_to_demand: convertToDemand,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao processar PDF: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[v0] PDF processing result:', data)

      if (data.success) {
        setResult('success')
        setResumo(data.resumo || 'Importação concluída com sucesso!')
        setFile(null)
        setConvertToDemand(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        onSuccess()
      } else {
        setResult('error')
      }
    } catch (error) {
      console.error('[v0] Error processing PDF:', error)
      setResult('error')
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

        {file && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-semibold mb-3">
                Deseja converter os itens em demandas automaticamente?
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setConvertToDemand(false)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    convertToDemand === false
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:border-primary/50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      convertToDemand === false
                        ? 'border-primary bg-primary'
                        : 'border-input'
                    }`}
                  >
                    {convertToDemand === false && (
                      <div className="w-2 h-2 bg-white rounded-sm" />
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    Apenas criar roteiros/briefings
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setConvertToDemand(true)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    convertToDemand === true
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:border-primary/50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      convertToDemand === true
                        ? 'border-primary bg-primary'
                        : 'border-input'
                    }`}
                  >
                    {convertToDemand === true && (
                      <div className="w-2 h-2 bg-white rounded-sm" />
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    Criar roteiros/briefings E converter em demandas
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleProcessPDF}
          disabled={!file || isLoading || convertToDemand === null}
          className="w-full"
        >
          {isLoading ? 'Analisando PDF...' : 'Processar PDF'}
        </Button>

        {isLoading && (
          <p className="text-xs text-muted-foreground text-center">
            Isso pode levar alguns segundos...
          </p>
        )}

        {result === 'success' && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700">
              ✅ Importação concluída!
            </AlertTitle>
            <AlertDescription className="text-green-600">
              {resumo}
            </AlertDescription>
          </Alert>
        )}

        {result === 'error' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>❌ Erro ao importar PDF</AlertTitle>
            <AlertDescription>
              Verifique o arquivo e tente novamente.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
