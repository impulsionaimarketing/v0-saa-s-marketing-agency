'use client'

import React from "react"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { ModuleAccessWrapper } from '@/components/auth/module-access-wrapper'
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
import { User, Bell, Shield, Palette, Save, Lock } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import type { UserRole } from '@/lib/mock-data'
import { createClient } from '@/lib/supabase/client'

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
  const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '' })
  const [userInitial, setUserInitial] = useState(user?.name ? user?.name.charAt(0).toUpperCase() : 'U')
  const [isSaving, setIsSaving] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Save logic here
    setIsSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)
    // Change password logic here
    setIsChangingPassword(false)
  }

  return (
    <ProtectedRoute>
      <ModuleAccessWrapper moduleName="configuracoes" moduleDisplayName="Configurações">
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
                {/* Profile editing disabled - managed by admin */}
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

            {/* Password Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  <CardTitle className="text-lg">Segurança</CardTitle>
                </div>
                <CardDescription>Gerencie sua senha e segurança da conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {showChangePassword ? (
                  <div className="space-y-4 rounded-lg border border-border p-4 bg-secondary/50">
                    <h4 className="font-semibold">Alterar Senha</h4>
                    
                    {passwordSuccess ? (
                      <div className="rounded-lg bg-green-500/10 p-4 text-sm text-green-600 text-center">
                        Senha alterada com sucesso!
                      </div>
                    ) : (
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        {passwordError && (
                          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                            {passwordError}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="current-pwd" className="text-sm">
                            Senha Atual
                          </Label>
                          <Input
                            id="current-pwd"
                            type="password"
                            placeholder="Sua senha atual"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={isChangingPassword}
                            className="bg-background border-border text-sm"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new-pwd" className="text-sm">
                            Nova Senha
                          </Label>
                          <Input
                            id="new-pwd"
                            type="password"
                            placeholder="Nova senha (mín. 6 caracteres)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isChangingPassword}
                            className="bg-background border-border text-sm"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirm-pwd" className="text-sm">
                            Confirmar Nova Senha
                          </Label>
                          <Input
                            id="confirm-pwd"
                            type="password"
                            placeholder="Confirme a nova senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isChangingPassword}
                            className="bg-background border-border text-sm"
                            required
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            type="submit"
                            className="flex-1"
                            disabled={isChangingPassword}
                          >
                            {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() => {
                              setShowChangePassword(false)
                              setCurrentPassword('')
                              setNewPassword('')
                              setConfirmPassword('')
                              setPasswordError(null)
                            }}
                            disabled={isChangingPassword}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowChangePassword(true)}
                    variant="outline"
                    className="w-full sm:w-auto gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Alterar Senha
                  </Button>
                )}
              </CardContent>
            </Card>


          </div>
        </AppShell>
      </ModuleAccessWrapper>
    </ProtectedRoute>
  )
}
