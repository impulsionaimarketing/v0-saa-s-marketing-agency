'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Folder, Search, Calendar, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientMonthlyScheduleTab } from '@/components/clients/client-monthly-schedule-tab'
import { DocumentsSection } from '@/components/documents/documents-section'
import { getClients, type Client } from '@/lib/data/clients'
import { getDocumentCountsByClient } from '@/lib/data/client-documents'

// Cronograma estilo Drive: cada cliente é uma pasta; dentro dela ficam os documentos
export function CronogramaContent() {
  const [clients, setClients] = useState<Client[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Client | null>(null)

  const loadCounts = async () => setCounts(await getDocumentCountsByClient())

  useEffect(() => {
    async function load() {
      const [clientsData, countData] = await Promise.all([
        getClients({ status: 'Ativo' }),
        getDocumentCountsByClient(),
      ])
      setClients(clientsData)
      setCounts(countData)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [clients, search],
  )

  // Dentro de uma pasta (cliente)
  if (selected) {
    return (
      <div className="flex flex-col gap-4 p-3 sm:p-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="icon" className="shrink-0" aria-label="Voltar para as pastas"
            onClick={() => { setSelected(null); loadCounts() }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Folder className="h-5 w-5 shrink-0 text-primary" />
          <h1 className="min-w-0 truncate text-xl font-bold sm:text-2xl">{selected.name}</h1>
        </div>

        <Tabs defaultValue="documentos">
          <TabsList className="grid w-full grid-cols-2 sm:w-80">
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="planejamento">Planejamento</TabsTrigger>
          </TabsList>
          <TabsContent value="documentos" className="mt-4">
            <DocumentsSection clientId={selected.id} clientName={selected.name} />
          </TabsContent>
          <TabsContent value="planejamento" className="mt-4">
            <ClientMonthlyScheduleTab clientId={selected.id} showDocuments={false} />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Lista de pastas
  return (
    <div className="flex flex-col gap-4 p-3 sm:p-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-7 w-7 shrink-0 text-primary sm:h-8 sm:w-8" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Cronograma Mensal</h1>
          <p className="text-sm text-muted-foreground">Uma pasta por cliente, com planejamentos e roteiros</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar pasta…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-secondary border-border pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma pasta encontrada.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((client) => {
            const count = counts[client.id] || 0
            return (
              <button
                key={client.id}
                type="button"
                onClick={() => setSelected(client)}
                className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors active:bg-muted/50 sm:hover:bg-muted/30"
              >
                <Folder className="h-9 w-9 text-primary" fill="currentColor" fillOpacity={0.15} />
                <span className="w-full line-clamp-2 text-sm font-medium leading-tight">{client.name}</span>
                <span className="text-xs text-muted-foreground">
                  {count === 0 ? 'Vazia' : `${count} ${count === 1 ? 'documento' : 'documentos'}`}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
