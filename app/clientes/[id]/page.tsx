'use client'

import { TableCell } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
import { Table } from "@/components/ui/table"
import { use } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PaymentManagement } from '@/components/clients/payment-management'
import { usePaymentManagement } from '@/hooks/use-payment-management'
import { ArrowLeft, Building2, User, Target, Palette, Video, Megaphone, MessageSquare, DollarSign } from 'lucide-react'
import { clients, demands, productions, campaigns, reports } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const statusColors = {
  Ativo: 'bg-success/10 text-success border-success/20',
  Pausado: 'bg-warning/10 text-warning border-warning/20',
  Perdido: 'bg-destructive/10 text-destructive border-destructive/20',
}

const demandStatusColors: Record<string, string> = {
  'A Fazer': 'bg-muted text-muted-foreground',
  'Em Produção': 'bg-chart-2/10 text-chart-2',
  'Em Revisão': 'bg-warning/10 text-warning',
  'Aprovado': 'bg-primary/10 text-primary',
  'Publicado': 'bg-success/10 text-success',
  'Atrasado': 'bg-destructive/10 text-destructive',
}

const productionStatusColors: Record<string, string> = {
  'Planejamento': 'bg-muted text-muted-foreground',
  'Aprovação do Cliente': 'bg-warning/10 text-warning',
  'Captação': 'bg-chart-2/10 text-chart-2',
  'Edição': 'bg-chart-2/10 text-chart-2',
  'Revisão': 'bg-warning/10 text-warning',
  'Legenda': 'bg-primary/10 text-primary',
  'Programado': 'bg-primary/10 text-primary',
  'Publicado': 'bg-success/10 text-success',
  'Em Tráfego': 'bg-success/10 text-success',
  'Finalizado': 'bg-success/10 text-success',
}

const performanceColors = {
  green: 'bg-success/10 text-success',
  yellow: 'bg-warning/10 text-warning',
  red: 'bg-destructive/10 text-destructive',
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const client = clients.find((c) => c.id === id)

  if (!client) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-muted-foreground">Cliente não encontrado</p>
          <Link href="/clientes">
            <Button variant="link">Voltar para clientes</Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  const clientDemands = demands.filter((d) => d.clientId === id)
  const clientProductions = productions.filter((p) => p.clientId === id)
  const clientCampaigns = campaigns.filter((c) => c.clientId === id)
  const clientReports = reports.filter((r) => r.clientId === id)

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{client.name}</h1>
              <Badge variant="outline" className={cn(statusColors[client.contractStatus])}>
                {client.contractStatus}
              </Badge>
            </div>
            <p className="text-muted-foreground">Responsável: {client.responsible}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dados" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
            <TabsTrigger value="cobranças">Cobranças</TabsTrigger>
            <TabsTrigger value="estrategia">Estratégia</TabsTrigger>
            <TabsTrigger value="demandas">Demandas</TabsTrigger>
            <TabsTrigger value="producao">Produção</TabsTrigger>
            <TabsTrigger value="trafego">Tráfego Pago</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          {/* Dados Gerais */}
          <TabsContent value="dados" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Informações básicas */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informações da Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Cliente</p>
                      <p className="font-medium">{client.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Campanha</p>
                      <p className="font-medium">{client.campaignType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Plano Contratado</p>
                      <p className="font-medium">{client.plan}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor do Serviço</p>
                      <p className="font-medium">R$ {client.value.toLocaleString('pt-BR')}/mês</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Renovação</p>
                      <p className="font-medium">{new Date(client.renewalDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contas e IDs */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Contas e Integrações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Grupo WhatsApp</p>
                    <p className="font-medium">{client.whatsappGroup.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{client.whatsappGroup.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conta de Anúncios</p>
                    <p className="font-medium">{client.adAccount.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{client.adAccount.id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Business Manager ID</p>
                      <p className="text-xs font-mono">{client.businessManagerId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Google Ads ID</p>
                      <p className="text-xs font-mono">{client.googleAdsId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Responsáveis */}
              <Card className="bg-card border-border md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Responsáveis por Área
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                        <Palette className="h-5 w-5 text-chart-3" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Arte</p>
                        <p className="font-medium text-sm">{client.responsibles.arte}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                        <Video className="h-5 w-5 text-chart-2" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Vídeo</p>
                        <p className="font-medium text-sm">{client.responsibles.video}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tráfego</p>
                        <p className="font-medium text-sm">{client.responsibles.trafego}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
                        <MessageSquare className="h-5 w-5 text-chart-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Comunicação</p>
                        <p className="font-medium text-sm">{client.responsibles.comunicacao}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pagamento */}
          <TabsContent value="pagamento" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Informações de Pagamento */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Configuração de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Frequência de Pagamento</p>
                    <p className="text-2xl font-bold">{client.paymentFrequency}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {client.paymentFrequency === 'Semanal' && 'Pagamento realizado a cada 7 dias'}
                      {client.paymentFrequency === 'Quinzenal' && 'Pagamento realizado a cada 15 dias'}
                      {client.paymentFrequency === 'Mensal' && 'Pagamento realizado a cada 30 dias'}
                      {client.paymentFrequency === 'Bimestral' && 'Pagamento realizado a cada 60 dias'}
                      {client.paymentFrequency === 'Trimestral' && 'Pagamento realizado a cada 90 dias'}
                      {client.paymentFrequency === 'Anual' && 'Pagamento realizado anualmente'}
                    </p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Valor por Período</span>
                        <span className="font-bold text-lg">R$ {client.value.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Data de Renovação</span>
                        <span className="font-medium">{new Date(client.renewalDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status do Contrato</span>
                        <Badge variant="outline" className={cn(statusColors[client.contractStatus])}>
                          {client.contractStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Próximos Pagamentos */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Próximos Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((index) => {
                      const nextDate = new Date(client.renewalDate)
                      const frequencyDays = 
                        client.paymentFrequency === 'Semanal' ? 7 :
                        client.paymentFrequency === 'Quinzenal' ? 15 :
                        client.paymentFrequency === 'Mensal' ? 30 :
                        client.paymentFrequency === 'Bimestral' ? 60 :
                        client.paymentFrequency === 'Trimestral' ? 90 : 365
                      
                      nextDate.setDate(nextDate.getDate() + (frequencyDays * (index - 1)))
                      
                      return (
                        <div key={index} className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div>
                            <p className="text-sm font-medium">Pagamento {index}</p>
                            <p className="text-xs text-muted-foreground">{nextDate.toLocaleDateString('pt-BR')}</p>
                          </div>
                          <span className="font-bold">R$ {client.value.toLocaleString('pt-BR')}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cobranças */}
          <TabsContent value="cobranças" className="space-y-6">
            <CobrancasTab client={client} />
          </TabsContent>

          {/* Estratégia */}
          <TabsContent value="estrategia" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Estratégia Mensal</CardTitle>
                <CardDescription>Planejamento e objetivos do mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Estratégia do mês será exibida aqui</p>
                  <Button className="mt-4 bg-transparent" variant="outline">Definir Estratégia</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demandas */}
          <TabsContent value="demandas">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Demandas ({clientDemands.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Demanda</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientDemands.map((demand) => (
                      <TableRow key={demand.id} className="border-border">
                        <TableCell className="font-medium">{demand.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{demand.area}</Badge>
                        </TableCell>
                        <TableCell>{demand.responsible}</TableCell>
                        <TableCell>{new Date(demand.deadline).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Badge className={cn(demandStatusColors[demand.status])}>
                            {demand.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Produção */}
          <TabsContent value="producao">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Produção de Conteúdo ({clientProductions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Tipo</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Data Prevista</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientProductions.map((production) => (
                      <TableRow key={production.id} className="border-border">
                        <TableCell>
                          <Badge variant="secondary">{production.type}</Badge>
                        </TableCell>
                        <TableCell>{production.responsible}</TableCell>
                        <TableCell>{new Date(production.postDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Badge className={cn(productionStatusColors[production.status])}>
                            {production.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tráfego Pago */}
          <TabsContent value="trafego">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Campanhas de Tráfego ({clientCampaigns.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Campanha</TableHead>
                      <TableHead>Objetivo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Orçamento/dia</TableHead>
                      <TableHead className="text-right">CPL</TableHead>
                      <TableHead className="text-center">Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientCampaigns.map((campaign) => (
                      <TableRow key={campaign.id} className="border-border">
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.objective}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{campaign.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">R$ {campaign.dailyBudget}</TableCell>
                        <TableCell className="text-right">R$ {campaign.cpl.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(performanceColors[campaign.performance])}>
                            {campaign.performance === 'green' ? 'Bom' : campaign.performance === 'yellow' ? 'Alerta' : 'Ruim'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="relatorios">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Relatórios ({clientReports.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Mês</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resultados</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientReports.map((report) => (
                      <TableRow key={report.id} className="border-border">
                        <TableCell className="font-medium">{report.month}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            report.status === 'Enviado' 
                              ? 'bg-success/10 text-success' 
                              : 'bg-warning/10 text-warning'
                          )}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{report.results}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

interface CobrancasTabProps {
  client: typeof clients[0]
}

function CobrancasTab({ client }: CobrancasTabProps) {
  const {
    payments,
    isLoaded,
    togglePayment,
    getTotalPaid,
    getTotalDue,
    getPaidCount,
    getPendingCount,
  } = usePaymentManagement(
    client.id,
    client.payment_frequency || 'Mensal',
    client.contract_start_date || '',
    client.contract_end_date || '',
    client.monthly_value || 0
  )

  return (
    <PaymentManagement
      payments={payments}
      isLoaded={isLoaded}
      onTogglePayment={togglePayment}
      totalPaid={getTotalPaid()}
      totalDue={getTotalDue()}
      paidCount={getPaidCount()}
      pendingCount={getPendingCount()}
    />
  )
}
