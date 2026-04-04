'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { generateMonthlyPaymentsAction } from '@/app/cobrancas/actions'
import { Calendar } from 'lucide-react'

interface GeneratePaymentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

export function GeneratePaymentsDialog({
  open,
  onOpenChange,
  onSuccess,
}: GeneratePaymentsDialogProps) {
  const currentDate = new Date()
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [year, setYear] = useState(currentDate.getFullYear())
  const [isPending, startTransition] = useTransition()

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const result = await generateMonthlyPaymentsAction(month, year)
        console.log('[v0] Generate payments result:', result)
        
        if (result && result.success) {
          alert(result.message)
          onSuccess()
          onOpenChange(false)
        } else {
          alert('Erro: ' + (result?.message || 'Erro desconhecido ao gerar pagamentos'))
        }
      } catch (error) {
        console.error('[v0] Error generating payments:', error)
        alert('Erro ao gerar pagamentos: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
      }
    })
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gerar Pagamentos do Mês
          </DialogTitle>
          <DialogDescription>
            Gera automaticamente os pagamentos para todos os clientes ativos com
            mensalidade configurada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="month">Mês</Label>
            <Select
              value={month.toString()}
              onValueChange={(value) => setMonth(parseInt(value))}
            >
              <SelectTrigger id="month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Ano</Label>
            <Select
              value={year.toString()}
              onValueChange={(value) => setYear(parseInt(value))}
            >
              <SelectTrigger id="year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">Observação:</p>
            <ul className="mt-1 list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Apenas clientes com status "Ativo" serão incluídos</li>
              <li>A mensalidade deve estar configurada no cadastro do cliente</li>
              <li>Pagamentos duplicados não serão criados</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? 'Gerando...' : 'Gerar Pagamentos'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
