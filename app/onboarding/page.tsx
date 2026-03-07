'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Search, CheckSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Client {
  id: string
  name: string
  type: string
  email?: string
  phone?: string
}

export default function OnboardingPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function loadClients() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/clients/search', {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          throw new Error('Erro ao carregar clientes')
        }

        const data = await response.json()
        setClients(data)
        setFilteredClients(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar clientes'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadClients()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients)
    } else {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredClients(filtered)
    }
  }, [searchTerm, clients])

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Onboarding de Clientes</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Selecione um cliente para acompanhar seu onboarding</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Nenhum cliente encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <Link key={client.id} href={`/onboarding/${encodeURIComponent(client.name)}`}>
                <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:border-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="line-clamp-2">{client.name}</CardTitle>
                        <CardDescription>{client.type}</CardDescription>
                      </div>
                      <CheckSquare className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {client.email && (
                      <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                    )}
                    {client.phone && (
                      <p className="text-sm text-muted-foreground">{client.phone}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
