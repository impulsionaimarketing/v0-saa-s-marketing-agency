'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientMonthlyScheduleTab } from '@/components/clients/client-monthly-schedule-tab'
import { getClients, type Client } from '@/lib/data/clients'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from 'lucide-react'

export function CronogramaContent() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')

  useEffect(() => {
    async function loadClients() {
      const clientsData = await getClients()
      setClients(clientsData)
      if (clientsData.length > 0) {
        setSelectedClientId(clientsData[0].id)
      }
    }
    loadClients()
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cronograma Mensal</h1>
          <p className="text-sm text-muted-foreground">Gerencie as quantidades mensais de entregas por cliente</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecione um Cliente</CardTitle>
          <CardDescription>Escolha o cliente para visualizar e editar seu cronograma mensal</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClientId && (
        <ClientMonthlyScheduleTab 
          clientId={selectedClientId}
          clientName={clients.find(c => c.id === selectedClientId)?.name}
        />
      )}
    </div>
  )
}
