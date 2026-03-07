'use client'

import { useState, useEffect } from 'react'
import { usePermissions, type Module } from '@/lib/hooks/use-permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Lock, Eye, Edit2, Ban } from 'lucide-react'

interface PermissionSelectorProps {
  userId?: string
  onPermissionsChange?: (permissions: Array<{
    moduleId: string
    canView: boolean
    canEdit: boolean
    isBlocked: boolean
  }>) => void
  readOnly?: boolean
}

export function PermissionSelector({
  userId,
  onPermissionsChange,
  readOnly = false,
}: PermissionSelectorProps) {
  const { modules, isLoading, getUserPermissions } = usePermissions()
  const [permissions, setPermissions] = useState<Record<string, {
    canView: boolean
    canEdit: boolean
    isBlocked: boolean
  }>>({})

  useEffect(() => {
    if (userId) {
      loadUserPermissions()
    } else {
      // Initialize with all permissions unchecked for new users
      const initialPermissions: Record<string, any> = {}
      modules.forEach((module) => {
        initialPermissions[module.id] = {
          canView: false,
          canEdit: false,
          isBlocked: false,
        }
      })
      setPermissions(initialPermissions)
    }
  }, [userId, modules])

  const loadUserPermissions = async () => {
    if (!userId) return

    try {
      const userPerms = await getUserPermissions(userId)
      
      const permsMap: Record<string, any> = {}
      userPerms.forEach((perm) => {
        permsMap[perm.module_id] = {
          canView: perm.can_view,
          canEdit: perm.can_edit,
          isBlocked: perm.is_blocked,
        }
      })
      setPermissions(permsMap)
    } catch (error) {
      console.error('[v0] Error loading user permissions:', error)
    }
  }

  const handlePermissionChange = (
    moduleId: string,
    permissionType: 'canView' | 'canEdit' | 'isBlocked',
    value: boolean
  ) => {
    const currentPerms = permissions[moduleId] || { canView: false, canEdit: false, isBlocked: false }
    
    let newPerms = { ...currentPerms, [permissionType]: value }
    
    // Se marcar "Sem Acesso", desmarcar visualizar e editar
    if (permissionType === 'isBlocked' && value) {
      newPerms = { canView: false, canEdit: false, isBlocked: true }
    }
    
    // Se marcar visualizar ou editar, desmarcar "Sem Acesso"
    if ((permissionType === 'canView' || permissionType === 'canEdit') && value) {
      newPerms = { ...newPerms, isBlocked: false }
    }

    const newPermissions = {
      ...permissions,
      [moduleId]: newPerms,
    }

    setPermissions(newPermissions)

    // Call callback with updated permissions
    if (onPermissionsChange) {
      const permissionsArray = Object.entries(newPermissions).map(([moduleId, perms]) => ({
        moduleId,
        ...perms,
      }))
      onPermissionsChange(permissionsArray)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-secondary rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="h-5 w-5" />
        <h3 className="font-semibold text-lg">Permissões por Módulo</h3>
      </div>

      <div className="grid gap-4">
        {modules.map((module) => {
          const perms = permissions[module.id] || { canView: false, canEdit: false, isBlocked: false }
          
          return (
            <Card key={module.id} className="bg-secondary/50 border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{module.display_name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {module.description}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {module.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {/* View Permission */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${module.id}-view`}
                      checked={perms.canView}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(module.id, 'canView', checked as boolean)
                      }
                      disabled={readOnly || perms.isBlocked}
                    />
                    <Label
                      htmlFor={`${module.id}-view`}
                      className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                    >
                      <Eye className="h-4 w-4 text-blue-500" />
                      Visualizar
                    </Label>
                  </div>

                  {/* Edit Permission */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${module.id}-edit`}
                      checked={perms.canEdit}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(module.id, 'canEdit', checked as boolean)
                      }
                      disabled={readOnly || perms.isBlocked}
                    />
                    <Label
                      htmlFor={`${module.id}-edit`}
                      className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                    >
                      <Edit2 className="h-4 w-4 text-amber-500" />
                      Editar
                    </Label>
                  </div>

                  {/* Blocked Permission */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${module.id}-blocked`}
                      checked={perms.isBlocked}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(module.id, 'isBlocked', checked as boolean)
                      }
                      disabled={readOnly}
                    />
                    <Label
                      htmlFor={`${module.id}-blocked`}
                      className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                    >
                      <Ban className="h-4 w-4 text-red-500" />
                      Sem Acesso
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
