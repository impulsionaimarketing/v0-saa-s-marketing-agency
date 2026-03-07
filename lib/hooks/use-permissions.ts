'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Module {
  id: string
  name: string
  display_name: string
  description: string
  icon: string
  sort_order: number
}

export interface Permission {
  module_id: string
  module_name: string
  display_name: string
  description: string
  icon: string
  can_view: boolean
  can_edit: boolean
  is_blocked: boolean
}

export function usePermissions() {
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadModules()
  }, [])

  const loadModules = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      const { data, error: rpcError } = await supabase.rpc('get_all_modules')

      if (rpcError) {
        throw new Error('Erro ao carregar módulos')
      }

      setModules(data || [])
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar módulos'
      setError(message)
      console.error('[v0] Error loading modules:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getUserPermissions = async (userId: string): Promise<Permission[]> => {
    try {
      const supabase = createClient()
      const { data, error: rpcError } = await supabase.rpc('get_user_permissions', {
        p_user_id: userId,
      })

      if (rpcError) {
        throw new Error('Erro ao carregar permissões do usuário')
      }

      return data || []
    } catch (err) {
      console.error('[v0] Error getting user permissions:', err)
      return []
    }
  }

  const updatePermission = async (
    userId: string,
    moduleId: string,
    canView: boolean,
    canEdit: boolean,
    isBlocked: boolean
  ) => {
    try {
      const supabase = createClient()
      const { data, error: rpcError } = await supabase.rpc('update_user_permission', {
        p_user_id: userId,
        p_module_id: moduleId,
        p_can_view: canView,
        p_can_edit: canEdit,
        p_is_blocked: isBlocked,
      })

      if (rpcError) {
        throw new Error('Erro ao atualizar permissão')
      }

      return data
    } catch (err) {
      console.error('[v0] Error updating permission:', err)
      throw err
    }
  }

  const updateMultiplePermissions = async (
    userId: string,
    permissions: Array<{
      moduleId: string
      canView: boolean
      canEdit: boolean
      isBlocked: boolean
    }>
  ) => {
    try {
      const supabase = createClient()
      
      for (const permission of permissions) {
        const { error: rpcError } = await supabase.rpc('update_user_permission', {
          p_user_id: userId,
          p_module_id: permission.moduleId,
          p_can_view: permission.canView,
          p_can_edit: permission.canEdit,
          p_is_blocked: permission.isBlocked,
        })

        if (rpcError) {
          throw new Error(`Erro ao atualizar permissão para módulo`)
        }
      }

      return { success: true }
    } catch (err) {
      console.error('[v0] Error updating permissions:', err)
      throw err
    }
  }

  return {
    modules,
    isLoading,
    error,
    loadModules,
    getUserPermissions,
    updatePermission,
    updateMultiplePermissions,
  }
}
