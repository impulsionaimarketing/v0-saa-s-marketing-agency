'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileUp, Loader2, CheckCircle2, AlertCircle, FileText, X } from 'lucide-react'

interface ImportPdfSectionProps {
  clientId: string
  clientName: string
  onImported?: () => void
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const WEBHOOK_URL = 'https://n8n.impulsionaimarketing.com.br/webhook/cronograma-importarpdf'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove the "data:application/pdf;base64," prefix
      const base64 = result.split(',')[1] ?? ''
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(file)
  })
}

export function ImportPdfSection({ clientId, clientName, onImported }: ImportPdfSectionProps) {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setSuccess(false)
    const selected = e.target.files?.[0]
    if (!selected) return

    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Apenas arquivos PDF são aceitos.')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setFile(selected)
  }

  const clearFile = () => {
    setFile(null)
    setError(null)
    setSuccess(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Selecione um arquivo PDF primeiro.')
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const pdfBase64 = await fileToBase64(file)

      const payload = {
        client_id: clientId,
        client_name: clientName,
        month,
        year,
        pdf_base64: pdfBase64,
        convert_to_demand: true,
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro do servidor (${response.status}): ${errorText || 'Resposta inválida'}`)
      }

      setSuccess(true)
      clearFile()
      onImported?.()
    } catch (err) {
      console.error('[v0] Error importing PDF:', err)
      let message = 'Erro ao importar o PDF. Tente novamente.'
      if (err instanceof DOMException && err.name === 'AbortError') {
        message = 'A requisição expirou. O processamento demorou muito. Tente novamente.'
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        message = 'Erro de conexão. Verifique sua internet e tente novamente.'
      } else if (err instanceof Error) {
        message = err.message
      }
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Mês</Label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, index) => (
              <option key={index} value={index + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Ano</Label>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <Label>Arquivo PDF</Label>
        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-1 flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-muted/30 px-6 py-8 text-center transition-colors hover:border-primary hover:bg-muted/50"
          >
            <FileUp className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Clique para selecionar um PDF</span>
            <span className="text-xs text-muted-foreground">Apenas arquivos .pdf são aceitos</span>
          </button>
        ) : (
          <div className="mt-1 flex items-center justify-between gap-3 rounded-md border border-input bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText className="h-5 w-5 flex-shrink-0 text-primary" />
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
            <Button type="button" size="icon" variant="ghost" onClick={clearFile}>
              <X className="h-4 w-4" />
              <span className="sr-only">Remover arquivo</span>
            </Button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Erro ao importar PDF</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-md border border-green-500/20 bg-green-500/10 p-4 text-green-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">PDF enviado com sucesso</p>
            <p className="mt-1 text-sm">O cronograma está sendo processado a partir do PDF.</p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleUpload} disabled={isUploading || !file}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando PDF...
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              Importar PDF
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
