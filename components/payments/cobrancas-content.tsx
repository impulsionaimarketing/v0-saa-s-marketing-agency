'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, DollarSign, CheckCircle2, Clock, AlertCircle, Calendar, LayoutGrid, Table } from 'lucide-react'
import { PaymentsTable } from '@/components/payments/payments-table'
import { PaymentsGrid } from '@/components/payments/payments-grid'
import { PaymentFormDialog } from '@/components/payments/payment-form-dialog'
import { GeneratePaymentsDialog } from '@/components/payments/generate-payments-dialog'
import { PaymentFilters } from '@/components/payments/payment-filters'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { type Payment } from '@/lib/data/payments'
import { getPaymentsAction } from '@/app/cobrancas/actions'
import { getPayments } from '@/lib/data/payments' // Declared the getPayments variable

export function CobrancasContent() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [isPending, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [activeView, setActiveView] = useState<string>("table")

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = () => {
    startTransition(async () => {
      const data = await getPaymentsAction()
      setPayments(data)
      setFilteredPayments(data)
    })
  }

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedPayment(null)
  }

  const calculateStats = (data: Payment[] = payments) => {
    const total = data.reduce((sum, p) => sum + p.amount, 0)
    const paid = data.filter((p) => p.is_paid).reduce((sum, p) => sum + p.amount, 0)
    const pending = data
      .filter((p) => !p.is_paid && new Date(p.due_date) >= new Date())
      .reduce((sum, p) => sum + p.amount, 0)
    const overdue = data
      .filter((p) => !p.is_paid && new Date(p.due_date) < new Date())
      .reduce((sum, p) => sum + p.amount, 0)

    return { total, paid, pending, overdue }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const stats = calculateStats(filteredPayments)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Cobranças</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie os pagamentos dos seus clientes
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setIsGenerateDialogOpen(true)} className="w-full sm:w-auto">
            <Calendar className="mr-2 h-4 w-4" />
            Gerar Pagamentos do Mês
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Pagamento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground">
              {payments.length} pagamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(stats.paid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.filter((p) => p.is_paid).length} pagos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">
              {formatCurrency(stats.pending)}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                payments.filter(
                  (p) => !p.is_paid && new Date(p.due_date) >= new Date()
                ).length
              }{' '}
              a receber
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasado</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(stats.overdue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                payments.filter(
                  (p) => !p.is_paid && new Date(p.due_date) < new Date()
                ).length
              }{' '}
              atrasados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments View */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Pagamentos</CardTitle>
              <CardDescription>
                Marque os pagamentos como recebidos ao clicar no checkbox
              </CardDescription>
            </div>
          </div>
          <div className="mt-4">
            <PaymentFilters payments={payments} onFiltersChange={setFilteredPayments} />
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando pagamentos...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum pagamento encontrado com os filtros selecionados
            </div>
          ) : (
            <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-full sm:max-w-[400px]">
                <TabsTrigger value="table" className="gap-2">
                  <Table className="h-4 w-4" />
                  Tabela
                </TabsTrigger>
                <TabsTrigger value="grid" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Quadrados
                </TabsTrigger>
              </TabsList>

              <TabsContent value="table" className="mt-6">
                <PaymentsTable
                  payments={filteredPayments}
                  onUpdate={loadPayments}
                  onEdit={handleEdit}
                />
              </TabsContent>

              <TabsContent value="grid" className="mt-6">
                <PaymentsGrid
                  payments={filteredPayments}
                  onUpdate={loadPayments}
                  onEdit={handleEdit}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <PaymentFormDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        payment={selectedPayment}
        onSuccess={loadPayments}
      />

      <GeneratePaymentsDialog
        open={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
        onSuccess={loadPayments}
      />
    </div>
  )
}
