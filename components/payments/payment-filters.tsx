'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, X } from 'lucide-react'
import { type Payment } from '@/lib/data/payments'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PaymentFiltersProps {
  payments: Payment[]
  onFiltersChange: (filtered: Payment[]) => void
}

export function PaymentFilters({ payments, onFiltersChange }: PaymentFiltersProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<Set<string>>(new Set())
  const [selectedClient, setSelectedClient] = useState<string>('')

  // Get unique months from payments
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    payments.forEach((payment) => {
      const date = new Date(payment.due_date)
      const monthYear = format(date, 'MM/yyyy')
      months.add(monthYear)
    })
    return Array.from(months).sort().reverse()
  }, [payments])

  // Get unique clients
  const uniqueClients = useMemo(() => {
    const clients = new Set<string>()
    payments.forEach((payment) => {
      if (payment.client_name) {
        clients.add(payment.client_name)
      }
    })
    return Array.from(clients).sort()
  }, [payments])

  // Apply filters
  useMemo(() => {
    let filtered = payments

    if (selectedMonth) {
      filtered = filtered.filter((payment) => {
        const monthYear = format(new Date(payment.due_date), 'MM/yyyy')
        return monthYear === selectedMonth
      })
    }

    if (selectedStatus.size > 0) {
      filtered = filtered.filter((payment) => {
        if (selectedStatus.has('pago')) {
          if (payment.is_paid) return true
        }
        if (selectedStatus.has('pendente')) {
          if (!payment.is_paid && new Date(payment.due_date) >= new Date()) return true
        }
        if (selectedStatus.has('atrasado')) {
          if (!payment.is_paid && new Date(payment.due_date) < new Date()) return true
        }
        return false
      })
    }

    if (selectedClient) {
      filtered = filtered.filter((payment) => payment.client_name === selectedClient)
    }

    onFiltersChange(filtered)
  }, [selectedMonth, selectedStatus, selectedClient, payments, onFiltersChange])

  const isFiltered = selectedMonth || selectedStatus.size > 0 || selectedClient

  const handleClearFilters = () => {
    setSelectedMonth('')
    setSelectedStatus(new Set())
    setSelectedClient('')
  }

  const toggleStatus = (status: string) => {
    const newStatus = new Set(selectedStatus)
    if (newStatus.has(status)) {
      newStatus.delete(status)
    } else {
      newStatus.add(status)
    }
    setSelectedStatus(newStatus)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Month Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            Mês: {selectedMonth || 'Todos'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => setSelectedMonth('')}>
            Todos os meses
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {availableMonths.map((month) => (
            <DropdownMenuItem
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={selectedMonth === month ? 'bg-accent' : ''}
            >
              {month}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            Status: {selectedStatus.size > 0 ? selectedStatus.size : 'Todos'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuCheckboxItem
            checked={selectedStatus.size === 0}
            onCheckedChange={() => setSelectedStatus(new Set())}
          >
            Todos os status
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={selectedStatus.has('pago')}
            onCheckedChange={() => toggleStatus('pago')}
          >
            Pago
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={selectedStatus.has('pendente')}
            onCheckedChange={() => toggleStatus('pendente')}
          >
            Pendente
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={selectedStatus.has('atrasado')}
            onCheckedChange={() => toggleStatus('atrasado')}
          >
            Atrasado
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Client Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            Cliente: {selectedClient ? selectedClient.substring(0, 15) + '...' : 'Todos'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => setSelectedClient('')}>
            Todos os clientes
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {uniqueClients.map((client) => (
            <DropdownMenuItem
              key={client}
              onClick={() => setSelectedClient(client)}
              className={selectedClient === client ? 'bg-accent' : ''}
            >
              {client}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear Filters Button */}
      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="gap-2 text-destructive hover:text-destructive"
        >
          Limpar Filtros
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Active Filters Display */}
      {isFiltered && (
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {selectedMonth && (
            <Badge variant="secondary" className="gap-1">
              Mês: {selectedMonth}
              <button
                onClick={() => setSelectedMonth('')}
                className="ml-1 hover:text-destructive"
              >
                ✕
              </button>
            </Badge>
          )}
          {selectedStatus.size > 0 && (
            <Badge variant="secondary" className="gap-1">
              Status: {Array.from(selectedStatus).join(', ')}
              <button
                onClick={() => setSelectedStatus(new Set())}
                className="ml-1 hover:text-destructive"
              >
                ✕
              </button>
            </Badge>
          )}
          {selectedClient && (
            <Badge variant="secondary" className="gap-1">
              {selectedClient}
              <button
                onClick={() => setSelectedClient('')}
                className="ml-1 hover:text-destructive"
              >
                ✕
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
