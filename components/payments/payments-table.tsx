'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { type Payment } from '@/lib/data/payments'
import { markPaymentAsPaidAction, markPaymentAsUnpaidAction, deletePaymentAction } from '@/app/cobrancas/actions'
import { cn } from '@/lib/utils'

interface PaymentsTableProps {
  payments: Payment[]
  onUpdate: () => void
  onEdit: (payment: Payment) => void
}

export function PaymentsTable({ payments, onUpdate, onEdit }: PaymentsTableProps) {
  const [isPending, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleCheckboxChange = async (payment: Payment) => {
    setProcessingId(payment.id)
    startTransition(async () => {
      try {
        if (payment.is_paid) {
          await markPaymentAsUnpaidAction(payment.id)
        } else {
          await markPaymentAsPaidAction(payment.id, new Date().toISOString().split('T')[0])
        }
        onUpdate()
      } catch (error) {
        console.error('[v0] Error updating payment status:', error)
        alert('Erro ao atualizar status do pagamento')
      } finally {
        setProcessingId(null)
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pagamento?')) return
    
    startTransition(async () => {
      try {
        await deletePaymentAction(id)
        onUpdate()
      } catch (error) {
        console.error('[v0] Error deleting payment:', error)
        alert('Erro ao excluir pagamento')
      }
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const isOverdue = (dueDate: string, isPaid: boolean) => {
    if (isPaid) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-[700px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Pago</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Data Pagamento</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                Nenhum pagamento cadastrado
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow
                key={payment.id}
                className={cn(
                  'transition-colors',
                  payment.is_paid && 'bg-success/5',
                  isOverdue(payment.due_date, payment.is_paid) && 'bg-destructive/5'
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={payment.is_paid}
                    disabled={isPending && processingId === payment.id}
                    onCheckedChange={() => handleCheckboxChange(payment)}
                  />
                </TableCell>
                <TableCell className="font-medium">{payment.client_name}</TableCell>
                <TableCell>
                  {format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                <TableCell>
                  {payment.paid_date
                    ? format(new Date(payment.paid_date), 'dd/MM/yyyy', { locale: ptBR })
                    : '-'}
                </TableCell>
                <TableCell>{payment.payment_method || '-'}</TableCell>
                <TableCell>
                  {payment.is_paid ? (
                    <Badge className="bg-success">Pago</Badge>
                  ) : isOverdue(payment.due_date, payment.is_paid) ? (
                    <Badge variant="destructive">Atrasado</Badge>
                  ) : (
                    <Badge variant="secondary">Pendente</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(payment)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(payment.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
