'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppShell, useAppContext } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Bell, Shield, Palette, Save } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import type { UserRole } from '@/lib/mock-data'

const rolePermissions = {
  Admin: {
    description: 'Acesso total a todas as funcionalidades',
    permissions: ['Dashboard', 'Clientes', 'Demandas', 'Produção', 'Tráfego', 'Relatórios', 'Colaboradores', 'Alertas', 'Configurações'],
  },
  Gestor: {
    description: 'Visualiza clientes e métricas, sem acesso a configurações',
    permissions: ['Dashboard', 'Clientes', 'Demandas', 'Produção', 'Tráfego', 'Relatórios'],
  },
  Colaborador: {
    description: 'Acesso apenas às próprias demandas e produção',
    permissions: ['Dashboard (limitado)', 'Demandas (próprias)', 'Produção (próprias)'],
  },
}

export default function ConfiguracoesPage() {
  const { currentRole, setCurrentRole } = useAppContext()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Aqui você pode adicionar a lógica para salvar as alterações
      console.log('[v0] Saving user data:', formData)
      // Simular delay de salvamento
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('[v0] Error saving user data:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U'

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6 max-w-4xl">
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as configurações da plataforma</p>
          </div>

          {/* Profile Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle className="text-lg">Perfil</CardTitle>
              </div>
              <CardDescription>Informações da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {userInitial}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{user?.name || 'Usuário'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || 'email@example.com'}</p>
                  <p className="text-sm text-muted-foreground">Função: {user?.role || 'Colaborador'}</p>
                  {user?.area && user.area !== 'Nenhuma' && (
                    <p className="text-sm text-muted-foreground">Área: {user.area}</p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-secondary border-border text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-secondary border-border text-sm" 
                    disabled
                  />
                </div>
              </div>
              <Button className="gap-2 w-full sm:w-auto" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardContent>
          </Card>

          {/* Permissions Demo */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle className="text-lg">Permissões</CardTitle>
              </div>
              <CardDescription>Seu nível de acesso e funcionalidades disponíveis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Perfil Atual</Label>
                <div className="w-full sm:w-48 px-3 py-2 rounded-md border border-border bg-secondary text-sm">
                  {user?.role || 'Colaborador'}
                </div>
              </div>

              <div className="space-y-4">
                {(Object.entries(rolePermissions) as [UserRole, typeof rolePermissions.Admin][]).map(([role, info]) => (
                  <div
                    key={role}
                    className={cn(
                      'rounded-lg border p-4 transition-colors',
                      user?.role === role ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{role}</h4>
                        {user?.role === role && (
                          <Badge className="bg-primary/10 text-primary">Ativo</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{info.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {info.permissions.map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle className="text-lg">Notificações</CardTitle>
              </div>
              <CardDescription>Configure suas preferências de notificação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de tarefas atrasadas</p>
                  <p className="text-sm text-muted-foreground">Receba notificações quando tarefas estiverem atrasadas</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de contas de anúncio</p>
                  <p className="text-sm text-muted-foreground">Receba notificações sobre problemas com contas</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Relatórios pendentes</p>
                  <p className="text-sm text-muted-foreground">Lembrete quando relatórios estiverem pendentes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Resumo diário por email</p>
                  <p className="text-sm text-muted-foreground">Receba um resumo diário das atividades</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle className="text-lg">Aparência</CardTitle>
              </div>
              <CardDescription>Personalize a aparência da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select defaultValue="dark">
                  <SelectTrigger className="w-full sm:w-48 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Select defaultValue="pt-BR">
                  <SelectTrigger className="w-full sm:w-48 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (BR)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
