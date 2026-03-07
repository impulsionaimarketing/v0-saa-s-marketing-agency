'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DollarSign, Clock, CheckCircle, AlertCircle, Filter } from 'lucide-react'
import { usePaymentManagement } from '@/hooks/use-payment-management'
import { getClients } from '@/lib/data/clients'
import { cn } from '@/lib/utils'
import type { Client } from '@/lib/data/clients'

export default function CobrancasPage() {
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [isMounted, setIsMounted] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [allPayments, setAllPayments] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all')
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'current-month' | 'current-year'>('all')
  const [currentDate] = useState(new Date())

  const client = clients.find((c) => c.id === selectedClient)
  const isViewingAll = selectedClient === 'all'

  const {
    payments,
    isLoaded,
    togglePayment,
    getTotalPaid,
    getTotalDue,
    getPaidCount,
    getPendingCount,
  } = usePaymentManagement(
    selectedClient === 'all' ? '' : selectedClient,
    client?.payment_frequency || 'Mensal',
    client?.contract_start_date || '',
    client?.contract_end_date || '',
    client?.monthly_value || 0
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)
        const clientsData = await getClients()
        setClients(clientsData)
      } catch (error) {
        console.error('[v0] Error fetching clients:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isMounted) {
      fetchClients()
    }
  }, [isMounted])

  useEffect(() => {
    if (isViewingAll && clients.length > 0) {
      const allPaymentsList: any[] = []
      clients.forEach((c) => {
        // This would normally come from database, for now using mock calculation
        const frequencyDays: { [key: string]: number } = {
          Semanal: 7,
          Quinzenal: 15,
          Mensal: 30,
          Bimestral: 60,
          Trimestral: 90,
          Anual: 365,
        }

        if (c.contract_start_date && c.contract_end_date) {
          const startDate = new Date(c.contract_start_date)
          const endDate = new Date(c.contract_end_date)
          let currentDate = new Date(startDate)
          const daysToAdd = frequencyDays[c.payment_frequency || 'Mensal'] || 30

          while (currentDate <= endDate) {
            allPaymentsList.push({
              id: `${c.id}-${currentDate.toISOString().split('T')[0]}`,
              client_id: c.id,
              client_name: c.name,
              due_date: currentDate.toISOString().split('T')[0],
              amount: c.monthly_value,
              is_paid: false,
              paid_date: null,
            })
            currentDate.setDate(currentDate.getDate() + daysToAdd)
          }
        }
      })

      // Sort by due date
      allPaymentsList.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      setAllPayments(allPaymentsList)
    }
  }, [isViewingAll, clients])

  // Filter payments based on status and period
  const getFilteredPayments = (paymentsList: any[]) => {
    let filtered = [...paymentsList]

    // Filter by status
    if (filterStatus === 'paid') {
      filtered = filtered.filter((p) => p.is_paid || p.isPaid)
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter((p) => !(p.is_paid || p.isPaid))
    }

    // Filter by period
    if (filterPeriod !== 'all') {
      const now = new Date(currentDate)
      const year = now.getFullYear()
      const month = now.getMonth()

      filtered = filtered.filter((p) => {
        const paymentDate = new Date(p.due_date || p.dueDate)
        const paymentYear = paymentDate.getFullYear()
        const paymentMonth = paymentDate.getMonth()

        if (filterPeriod === 'current-month') {
          return paymentYear === year && paymentMonth === month
        } else if (filterPeriod === 'current-year') {
          return paymentYear === year
        }
        return true
      })
    }

    return filtered
  }

  const filteredPayments = getFilteredPayments(isViewingAll ? allPayments : payments)
  const filteredAllPayments = getFilteredPayments(allPayments)

  if (!isMounted || loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando cobranças...</p>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold">Cobranças</h1>
            <p className="text-muted-foreground">Gerencie as cobranças dos clientes</p>
          </div>

          {/* Client selector */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Selecione um Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="font-semibold">Todas as Cobranças</span>
                  </SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Status de Pagamento</label>
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="paid">Pagas</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Período</label>
                  <Select value={filterPeriod} onValueChange={(value: any) => setFilterPeriod(value)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="current-month">Mês Atual</SelectItem>
                      <SelectItem value="current-year">Ano Atual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Mês / Ano</label>
                  <div className="text-sm font-medium text-muted-foreground pt-2">
                    {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Devido</p>
                    <p className="text-xl font-bold">
                      R$ {filteredPayments
                        .filter(p => !(p.is_paid || p.isPaid))
                        .reduce((sum, p) => sum + (p.amount || 0), 0)
                        .toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Pago</p>
                    <p className="text-xl font-bold">
                      R$ {filteredPayments
                        .filter(p => p.is_paid || p.isPaid)
                        .reduce((sum, p) => sum + (p.amount || 0), 0)
                        .toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                    <Clock className="h-5 w-5 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                    <p className="text-xl font-bold">
                      {filteredPayments.filter(p => !(p.is_paid || p.isPaid)).length} de {filteredPayments.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Taxa de Pagamento</p>
                    <p className="text-xl font-bold">
                      {filteredPayments.length > 0
                        ? Math.round(
                            (filteredPayments.filter(p => p.is_paid || p.isPaid).length /
                              filteredPayments.length) *
                              100
                          )
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payments table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">
                {isViewingAll ? 'Todas as Cobranças' : `Cobranças de ${client.name}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="min-w-12">Pago</TableHead>
                      {isViewingAll && <TableHead className="min-w-32">Cliente</TableHead>}
                      <TableHead className="min-w-32">Data Vencimento</TableHead>
                      <TableHead className="text-right min-w-28">Valor</TableHead>
                      <TableHead className="min-w-24">Status</TableHead>
                      <TableHead className="min-w-32">Data de Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((payment: any) => (
                        <TableRow key={payment.id} className="border-border hover:bg-transparent">
                          <TableCell>
                            <Checkbox
                              checked={payment.is_paid || payment.isPaid}
                              onCheckedChange={() => togglePayment(payment.id)}
                              className="cursor-pointer"
                            />
                          </TableCell>
                          {isViewingAll && (
                            <TableCell className="text-sm font-medium">
                              {payment.client_name}
                            </TableCell>
                          )}
                          <TableCell className="text-sm">
                            {new Date(payment.due_date || payment.dueDate).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            R$ {(payment.amount || 0).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                (payment.is_paid || payment.isPaid)
                                  ? 'bg-success/10 text-success border-success/20'
                                  : 'bg-warning/10 text-warning border-warning/20'
                              )}
                            >
                              {(payment.is_paid || payment.isPaid) ? 'Pago' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {(payment.is_paid || payment.isPaid) && (payment.paid_date || payment.paidDate)
                              ? new Date(payment.paid_date || payment.paidDate).toLocaleDateString('pt-BR')
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isViewingAll ? 6 : 5} className="text-center py-8 text-muted-foreground">
                          Nenhuma cobrança encontrada para este período
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
