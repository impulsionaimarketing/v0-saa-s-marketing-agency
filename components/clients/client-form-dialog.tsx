'use client'

import React from "react"
import { DollarSign } from 'lucide-react'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Loader2, Building2, MessageSquare, TrendingUp, Trash2, Smartphone } from 'lucide-react'
import { createNewClient, updateClient, type Client, type WhatsAppInstance } from '@/lib/data/clients'

interface ClientFormDialogProps {
  client?: Client | null
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function ClientFormDialog({ client, onSuccess, trigger }: ClientFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [instances, setInstances] = useState<WhatsAppInstance[]>(
    client?.whatsapp_instances || []
  )

  // Sync form data and instances whenever the dialog opens
  useEffect(() => {
    if (open) {
      setInstances(client?.whatsapp_instances || [])
      setFormData({
        name: client?.name || '',
        type: client?.type || 'Serviço',
        campaign_type: client?.campaign_type || 'Mensagem',
        payment_frequency: client?.payment_frequency || 'Mensal',
        plan: client?.plan || '',
        monthly_value: client?.monthly_value?.toString() || '',
        payment_day: client?.payment_day?.toString() || '10',
        contract_status: client?.contract_status || 'Ativo',
        contract_start_date: client?.contract_start_date?.split('T')[0] || '',
        contract_end_date: client?.contract_end_date?.split('T')[0] || '',
        renewal_date: client?.renewal_date?.split('T')[0] || '',
        month_status: client?.month_status || 'green',
        whatsapp_group_name: client?.whatsapp_group_name || '',
        whatsapp_group_id: client?.whatsapp_group_id || '',
        ad_account_name: client?.ad_account_name || '',
        ad_account_id: client?.ad_account_id || '',
        business_manager_id: client?.business_manager_id || '',
        google_ads_id: client?.google_ads_id || '',
      })
    }
  }, [open, client])
  const [newInstance, setNewInstance] = useState<WhatsAppInstance>({
    instance_name: '',
    phone_number: '',
    evolution_instance_id: '',
    pixel_mensagem: '',
    status: 'pending',
    is_primary: false,
  })
  
  const [formData, setFormData] = useState({
    name: client?.name || '',
    type: client?.type || 'Serviço',
    campaign_type: client?.campaign_type || 'Mensagem',
    payment_frequency: client?.payment_frequency || 'Mensal',
    plan: client?.plan || '',
    monthly_value: client?.monthly_value?.toString() || '',
    payment_day: client?.payment_day?.toString() || '10',
    contract_status: client?.contract_status || 'Ativo',
    contract_start_date: client?.contract_start_date?.split('T')[0] || '',
    contract_end_date: client?.contract_end_date?.split('T')[0] || '',
    renewal_date: client?.renewal_date?.split('T')[0] || '',
    month_status: client?.month_status || 'green',
    whatsapp_group_name: client?.whatsapp_group_name || '',
    whatsapp_group_id: client?.whatsapp_group_id || '',
    ad_account_name: client?.ad_account_name || '',
    ad_account_id: client?.ad_account_id || '',
    business_manager_id: client?.business_manager_id || '',
    google_ads_id: client?.google_ads_id || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      try {
        const data = {
          name: formData.name,
          type: formData.type as Client['type'],
          campaign_type: formData.campaign_type as Client['campaign_type'],
          payment_frequency: formData.payment_frequency as Client['payment_frequency'],
          plan: formData.plan,
          monthly_value: parseFloat(formData.monthly_value),
          payment_day: formData.payment_day ? parseInt(formData.payment_day) : 10,
          contract_status: formData.contract_status as Client['contract_status'],
          contract_start_date: formData.contract_start_date || null,
          contract_end_date: formData.contract_end_date || null,
          renewal_date: formData.renewal_date || null,
          month_status: formData.month_status as Client['month_status'],
          whatsapp_group_name: formData.whatsapp_group_name || null,
          whatsapp_group_id: formData.whatsapp_group_id || null,
          whatsapp_instances: instances,
          ad_account_name: formData.ad_account_name || null,
          ad_account_id: formData.ad_account_id || null,
          business_manager_id: formData.business_manager_id || null,
          google_ads_id: formData.google_ads_id || null,
        }

        if (client) {
          await updateClient(client.id, data)
        } else {
          await createNewClient(data)
        }

        setOpen(false)
        onSuccess?.()
        
        if (!client) {
          setFormData({
            name: '',
            type: 'Serviço',
            campaign_type: 'Mensagem',
            plan: '',
            monthly_value: '',
            contract_status: 'Ativo',
            renewal_date: '',
            month_status: 'green',
            whatsapp_group_name: '',
            whatsapp_group_id: '',
            ad_account_name: '',
            ad_account_id: '',
            business_manager_id: '',
            google_ads_id: '',
          })
        }
      } catch (error) {
        console.error('[v0] Error saving client:', error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[650px] max-h-[90vh] overflow-y-auto bg-card border-border p-4 sm:p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{client ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {client ? 'Atualize as informações do cliente.' : 'Preencha os dados do novo cliente.'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="mt-4">
            <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
              <TabsList className="grid w-max sm:w-full grid-cols-4 min-w-full">
              <TabsTrigger value="basic" className="gap-2">
                <Building2 className="h-4 w-4" />
                Dados Básicos
              </TabsTrigger>
              <TabsTrigger value="financial" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Financeiro
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="ads" className="gap-2 text-xs sm:text-sm">
                <TrendingUp className="h-4 w-4" />
                Anúncios
              </TabsTrigger>
            </TabsList>
            </div>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome da empresa"
                  className="bg-secondary border-border"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Serviço">Servi��o</SelectItem>
                      <SelectItem value="Infoproduto">Infoproduto</SelectItem>
                      <SelectItem value="Local">Local</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="campaign_type">Tipo de Campanha *</Label>
                  <Select
                    value={formData.campaign_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, campaign_type: value }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mensagem">Mensagem</SelectItem>
                      <SelectItem value="Venda">Venda</SelectItem>
                      <SelectItem value="Alcance">Alcance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan">Plano *</Label>
                  <Input
                    id="plan"
                    value={formData.plan}
                    onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                    placeholder="Ex: Básico, Premium"
                    className="bg-secondary border-border"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="month_status">Status do Mês</Label>
                  <Select
                    value={formData.month_status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, month_status: value }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="green">Verde (Tudo OK)</SelectItem>
                      <SelectItem value="yellow">Amarelo (Atenção)</SelectItem>
                      <SelectItem value="red">Vermelho (Crítico)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4 mt-4">
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h4 className="font-medium mb-3">Informações de Pagamento</h4>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="payment_frequency">Frequência de Pagamento</Label>
                      <Select
                        value={formData.payment_frequency}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, payment_frequency: value }))}
                      >
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mensal">Mensal</SelectItem>
                          <SelectItem value="Trimestral">Trimestral</SelectItem>
                          <SelectItem value="Semestral">Semestral</SelectItem>
                          <SelectItem value="Anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="payment_day">Dia de Vencimento</Label>
                      <Input
                        id="payment_day"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.payment_day}
                        onChange={(e) => setFormData(prev => ({ ...prev, payment_day: e.target.value }))}
                        placeholder="10"
                        className="bg-background border-input"
                      />
                      <p className="text-xs text-muted-foreground">
                        Dia do mês para vencimento das cobranças (1-31)
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="monthly_value_info">Valor Mensal</Label>
                    <Input
                      id="monthly_value_info"
                      type="number"
                      step="0.01"
                      value={formData.monthly_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthly_value: e.target.value }))}
                      placeholder="0,00"
                      className="bg-background border-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Este valor será usado para gerar cobranças automáticas
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contract_start_date">Início do Contrato</Label>
                      <Input
                        id="contract_start_date"
                        type="date"
                        value={formData.contract_start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, contract_start_date: e.target.value }))}
                        className="bg-background border-input"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="contract_end_date">Fim do Contrato</Label>
                      <Input
                        id="contract_end_date"
                        type="date"
                        value={formData.contract_end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, contract_end_date: e.target.value }))}
                        className="bg-background border-input"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="renewal_date">Data de Renovação</Label>
                      <Input
                        id="renewal_date"
                        type="date"
                        value={formData.renewal_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, renewal_date: e.target.value }))}
                        className="bg-background border-input"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contract_status">Status do Contrato</Label>
                    <Select
                      value={formData.contract_status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, contract_status: value }))}
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                        <SelectItem value="Pausado">Pausado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4 mt-4">
              {/* Instâncias WhatsApp */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Instâncias WhatsApp
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Conecte as instâncias Evolution API deste cliente.
                    </p>
                  </div>
                </div>

                {/* Lista de instâncias salvas */}
                {instances.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {instances.map((inst, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-background rounded-md border border-border px-3 py-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{inst.instance_name || 'Sem nome'}</span>
                            {inst.is_primary && (
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Principal</span>
                            )}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              inst.status === 'connected' ? 'bg-success/10 text-success' :
                              inst.status === 'disconnected' ? 'bg-destructive/10 text-destructive' :
                              'bg-muted text-muted-foreground'
                            }`}>{inst.status}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{inst.phone_number || inst.evolution_instance_id}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInstances(prev => prev.filter((_, i) => i !== idx))}
                          className="text-destructive hover:text-destructive/80 p-1 rounded hover:bg-destructive/10 shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulário para adicionar nova instância */}
                <div className="border border-dashed border-border rounded-md p-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Adicionar nova instância</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Nome da Instância</Label>
                      <Input
                        value={newInstance.instance_name}
                        onChange={(e) => setNewInstance(prev => ({ ...prev, instance_name: e.target.value }))}
                        placeholder="Ex: impulsionai-cliente"
                        className="bg-background border-input h-8 text-sm"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Número de Telefone</Label>
                      <Input
                        value={newInstance.phone_number}
                        onChange={(e) => setNewInstance(prev => ({ ...prev, phone_number: e.target.value }))}
                        placeholder="5511999999999"
                        className="bg-background border-input h-8 text-sm"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">ID Evolution (instance ID)</Label>
                      <Input
                        value={newInstance.evolution_instance_id}
                        onChange={(e) => setNewInstance(prev => ({ ...prev, evolution_instance_id: e.target.value }))}
                        placeholder="ID da instância na Evolution API"
                        className="bg-background border-input h-8 text-sm"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Pixel de Mensagem</Label>
                      <Input
                        value={newInstance.pixel_mensagem}
                        onChange={(e) => setNewInstance(prev => ({ ...prev, pixel_mensagem: e.target.value }))}
                        placeholder="ID do pixel de mensagem"
                        className="bg-background border-input h-8 text-sm"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={newInstance.status}
                        onValueChange={(v) => setNewInstance(prev => ({ ...prev, status: v as WhatsAppInstance['status'] }))}
                      >
                        <SelectTrigger className="bg-background border-input h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="connected">Conectado</SelectItem>
                          <SelectItem value="disconnected">Desconectado</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newInstance.is_primary}
                        onChange={(e) => setNewInstance(prev => ({ ...prev, is_primary: e.target.checked }))}
                        className="rounded"
                      />
                      Instância principal
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!newInstance.instance_name) return
                        setInstances(prev => [...prev, newInstance])
                        setNewInstance({ instance_name: '', phone_number: '', evolution_instance_id: '', pixel_mensagem: '', status: 'pending', is_primary: false })
                      }}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Grupo WhatsApp */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h4 className="font-medium mb-3">Grupo do WhatsApp</h4>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="whatsapp_group_name">Nome do Grupo</Label>
                    <Input
                      id="whatsapp_group_name"
                      value={formData.whatsapp_group_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_group_name: e.target.value }))}
                      placeholder="Ex: Marketing - Cliente X"
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="whatsapp_group_id">ID do Grupo</Label>
                    <Input
                      id="whatsapp_group_id"
                      value={formData.whatsapp_group_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_group_id: e.target.value }))}
                      placeholder="ID do grupo no WhatsApp"
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ads" className="space-y-4 mt-4">
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h4 className="font-medium mb-3">Meta Ads (Facebook/Instagram)</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure as contas de anúncios do Meta Business.
                </p>
                
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ad_account_name">Nome da Conta de Anúncios</Label>
                      <Input
                        id="ad_account_name"
                        value={formData.ad_account_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, ad_account_name: e.target.value }))}
                        placeholder="Nome da conta"
                        className="bg-secondary border-border"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="ad_account_id">ID da Conta de Anúncios</Label>
                      <Input
                        id="ad_account_id"
                        value={formData.ad_account_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, ad_account_id: e.target.value }))}
                        placeholder="act_XXXXXXXXX"
                        className="bg-secondary border-border"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="business_manager_id">ID do Business Manager</Label>
                    <Input
                      id="business_manager_id"
                      value={formData.business_manager_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, business_manager_id: e.target.value }))}
                      placeholder="XXXXXXXXXXXXXXXXX"
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h4 className="font-medium mb-3">Google Ads</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure a conta do Google Ads.
                </p>
                
                <div className="grid gap-2">
                  <Label htmlFor="google_ads_id">ID da Conta Google Ads</Label>
                  <Input
                    id="google_ads_id"
                    value={formData.google_ads_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, google_ads_id: e.target.value }))}
                    placeholder="XXX-XXX-XXXX"
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 gap-2 flex-col sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {client ? 'Salvar' : 'Criar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
