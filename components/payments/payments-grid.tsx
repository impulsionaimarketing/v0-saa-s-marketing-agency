'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, Trash2, Calendar, DollarSign, Building2 } from 'lucide-react'
import { type Payment } from '@/lib/data/payments'
import { markPaymentAsPaidAction, markPaymentAsUnpaidAction, deletePaymentAction } from '@/app/cobrancas/actions'
import { cn } from '@/lib/utils'

interface PaymentsGridProps {
  payments: Payment[]
  onUpdate: () => void
  onEdit: (payment: Payment) => void
}

export function PaymentsGrid({ payments, onUpdate, onEdit }: PaymentsGridProps) {
  const [isPending, startTransition] = useTransition()

  const handleTogglePaid = (payment: Payment) => {
    startTransition(async () => {
      try {
        if (payment.is_paid) {
          await markPaymentAsUnpaidAction(payment.id)
        } else {
          await markPaymentAsPaidAction(payment.id, new Date().toISOString().split('T')[0])
        }
        onUpdate()
      } catch (error) {
        console.error('[v0] Error toggling payment status:', error)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pagamento?')) return

    startTransition(async () => {
      try {
        await deletePaymentAction(id)
        onUpdate()
      } catch (error) {
        console.error('[v0] Error deleting payment:', error)
      }
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const isOverdue = (payment: Payment) => {
    return !payment.is_paid && new Date(payment.due_date) < new Date()
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum pagamento encontrado
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {payments.map((payment) => (
        <Card
          key={payment.id}
          className={cn(
            'transition-all hover:shadow-md',
            payment.is_paid && 'border-success/50 bg-success/5',
            isOverdue(payment) && 'border-destructive/50 bg-destructive/5'
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={payment.is_paid}
                    onCheckedChange={() => handleTogglePaid(payment)}
                    disabled={isPending}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <CardTitle className="text-base leading-tight">
                    {payment.client_name}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span className="text-xs">Cliente</span>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(payment)}>
                    <Edit className="mr-2 h-4 w-4" />
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
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Valor</span>
              </div>
              <span className="text-lg font-bold">{formatCurrency(payment.amount)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Vencimento</span>
              </div>
              <span className="text-sm font-medium">{formatDate(payment.due_date)}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Status</span>
              {payment.is_paid ? (
                <Badge variant="default" className="bg-success text-success-foreground">
                  Pago
                </Badge>
              ) : isOverdue(payment) ? (
                <Badge variant="destructive">Atrasado</Badge>
              ) : (
                <Badge variant="secondary">Pendente</Badge>
              )}
            </div>

            {payment.paid_date && (
              <div className="text-xs text-muted-foreground">
                Pago em {formatDate(payment.paid_date)}
              </div>
            )}

            {payment.payment_method && (
              <div className="text-xs text-muted-foreground">
                Método: {payment.payment_method}
              </div>
            )}

            {payment.notes && (
              <div className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">
                {payment.notes}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
