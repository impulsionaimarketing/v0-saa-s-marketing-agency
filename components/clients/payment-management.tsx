'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Payment } from '@/lib/mock-data'

interface PaymentManagementProps {
  payments: Payment[]
  isLoaded: boolean
  onTogglePayment: (paymentId: string, isPaid: boolean) => void
  totalPaid: number
  totalDue: number
  paidCount: number
  pendingCount: number
}

export function PaymentManagement({
  payments,
  isLoaded,
  onTogglePayment,
  totalPaid,
  totalDue,
  paidCount,
  pendingCount,
}: PaymentManagementProps) {
  if (!isLoaded) {
    return <div>Carregando pagamentos...</div>
  }

  return (
    <div className="space-y-6">
      {/* Resumo de Pagamentos */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Devido</p>
              <p className="text-2xl font-bold">R$ {totalDue.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground mt-2">{payments.length} cobranças</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Pago</p>
              <p className="text-2xl font-bold text-success">R$ {totalPaid.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground mt-2">{paidCount} pagamentos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Pendente</p>
              <p className="text-2xl font-bold text-warning">R$ {(totalDue - totalPaid).toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground mt-2">{pendingCount} cobranças</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Taxa de Pagamento</p>
              <p className="text-2xl font-bold">{payments.length > 0 ? Math.round((paidCount / payments.length) * 100) : 0}%</p>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div
                  className="bg-success h-full rounded-full transition-all"
                  style={{ width: `${payments.length > 0 ? (paidCount / payments.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Pagamentos */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Histórico de Cobranças</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-12">Pago</TableHead>
                  <TableHead className="min-w-32">Data de Vencimento</TableHead>
                  <TableHead className="text-right min-w-32">Valor</TableHead>
                  <TableHead className="min-w-24">Status</TableHead>
                  <TableHead className="min-w-40">Data de Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhuma cobrança registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id} className="border-border hover:bg-muted/30">
                      <TableCell>
                        <Checkbox
                          checked={payment.isPaid}
                          onCheckedChange={(checked) => onTogglePayment(payment.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        R$ {payment.amount.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {payment.isPaid ? (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Pago
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
