'use client'

import React from "react"

import { useState, useTransition } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Loader2, Lock } from 'lucide-react'
import { createUser, updateUser, type User } from '@/lib/data/users'
import { createUserWithAuth } from '@/lib/auth/user-management'
import { PermissionSelector } from '@/components/permissions/permission-selector'
import { usePermissions } from '@/lib/hooks/use-permissions'

interface CollaboratorFormDialogProps {
  user?: User | null
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function CollaboratorFormDialog({ user, onSuccess, trigger }: CollaboratorFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const { updateMultiplePermissions } = usePermissions()
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'Colaborador',
    areas: user?.area ? [user.area] : ['Arte'],
    status: user?.status || 'Ativo',
  })

  const [permissions, setPermissions] = useState<Array<{
    moduleId: string
    canView: boolean
    canEdit: boolean
    isBlocked: boolean
  }>>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    startTransition(async () => {
      try {
        let userId = user?.id
        
        if (user) {
          const updateData: Partial<User> = {
            name: formData.name,
            email: formData.email,
            role: formData.role as User['role'],
            area: formData.areas[0] as User['area'], // Use first selected area
            status: formData.status as User['status'],
          }
          await updateUser(user.id, updateData)
        } else {
          // Create user with authentication
          if (!formData.password) {
            throw new Error('Senha é obrigatória para novo colaborador')
          }
          
          const result = await createUserWithAuth(formData.email, formData.password, {
            name: formData.name,
            role: formData.role as User['role'],
            area: formData.areas[0] as User['area'], // Use first selected area
            status: formData.status as User['status'],
          })
          userId = result.userId
        }

        // Update permissions if userId exists and permissions were set
        if (userId && permissions.length > 0) {
          await updateMultiplePermissions(userId, permissions.map(p => ({
            moduleId: p.moduleId,
            canView: p.canView,
            canEdit: p.canEdit,
            isBlocked: p.isBlocked,
          })))
        }

        setOpen(false)
        onSuccess?.()
        
        if (!user) {
          setFormData({
            name: '',
            email: '',
            password: '',
            role: 'Colaborador',
            areas: ['Arte'],
            status: 'Ativo',
          })
          setPermissions([])
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao salvar colaborador'
        setError(message)
        console.error('[v0] Error saving user:', err)
      }
    })
  }

  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Colaborador</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="w-full max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {user ? 'Editar Colaborador' : 'Novo Colaborador'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {user ? 'Atualize as informações do colaborador' : 'Adicione um novo colaborador à equipe'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-2 sm:p-3 text-xs sm:text-sm text-destructive">
              {error}
            </div>
          )}

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info" className="text-xs sm:text-sm">Informações</TabsTrigger>
              <TabsTrigger value="permissions" className="text-xs sm:text-sm flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Permissões
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Info Tab */}
              <TabsContent value="info" className="space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs sm:text-sm">Nome</Label>
                    <Input
                      id="name"
                      placeholder="Nome completo"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="bg-secondary border-border text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@empresa.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!!user}
                      required
                      className="bg-secondary border-border text-sm"
                    />
                  </div>
                </div>

                {!user && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs sm:text-sm">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Crie uma senha segura"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required={!user}
                      className="bg-secondary border-border text-sm"
                    />
                  </div>
                )}

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-xs sm:text-sm">Função</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger className="bg-secondary border-border text-sm">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Gestor">Gestor</SelectItem>
                        <SelectItem value="Colaborador">Colaborador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-xs sm:text-sm">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="bg-secondary border-border text-sm">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Áreas</Label>
                  <div className="space-y-2 bg-secondary p-3 rounded-md">
                    {['Arte', 'Vídeo', 'Tráfego', 'Comunicação'].map((area) => (
                      <div key={area} className="flex items-center gap-2">
                        <Checkbox
                          id={`area-${area}`}
                          checked={formData.areas.includes(area)}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              areas: checked
                                ? [...prev.areas, area]
                                : prev.areas.filter(a => a !== area)
                            }))
                          }}
                        />
                        <Label htmlFor={`area-${area}`} className="text-xs sm:text-sm cursor-pointer">
                          {area}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Permissions Tab */}
              <TabsContent value="permissions" className="space-y-4">
                <PermissionSelector
                  userId={user?.id}
                  onPermissionsChange={setPermissions}
                />
              </TabsContent>

              <DialogFooter className="gap-2 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto gap-2">
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {user ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
  )
}
