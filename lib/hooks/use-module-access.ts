'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'

export interface ModuleAccess {
  canView: boolean
  canEdit: boolean
  isBlocked: boolean
}

export function useModuleAccess(moduleName: string) {
  const { user } = useAuth()
  const [access, setAccess] = useState<ModuleAccess>({
    canView: false,
    canEdit: false,
    isBlocked: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAccess()
  }, [user, moduleName])

  const checkAccess = async () => {
    if (!user?.id) {
      setIsLoading(false)
      setAccess({
        canView: false,
        canEdit: false,
        isBlocked: true,
      })
      return
    }

    // Admins têm acesso total
    if (user.role === 'Admin') {
      setAccess({
        canView: true,
        canEdit: true,
        isBlocked: false,
      })
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      // Busca o módulo pelo nome
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('id')
        .ilike('name', moduleName)
        .single()

      if (moduleError || !moduleData) {
        // Se o módulo não existe na tabela, permite acesso por padrão
        setAccess({
          canView: true,
          canEdit: true,
          isBlocked: false,
        })
        setIsLoading(false)
        return
      }

      // Busca a permissão do usuário para este módulo
      const { data: permissionData, error: permissionError } = await supabase
        .from('user_permissions')
        .select('can_view, can_edit, is_blocked')
        .eq('user_id', user.id)
        .eq('module_id', moduleData.id)
        .single()

      if (permissionError || !permissionData) {
        // Se não há permissão configurada, permite acesso por padrão
        setAccess({
          canView: true,
          canEdit: true,
          isBlocked: false,
        })
      } else {
        // Verifica se está explicitamente bloqueado
        if (permissionData.is_blocked) {
          setAccess({
            canView: false,
            canEdit: false,
            isBlocked: true,
          })
        } else {
          setAccess({
            canView: permissionData.can_view ?? true,
            canEdit: permissionData.can_edit ?? true,
            isBlocked: false,
          })
        }
      }
    } catch (error) {
      // Em caso de erro, permite acesso por padrão
      setAccess({
        canView: true,
        canEdit: true,
        isBlocked: false,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    ...access,
    isLoading,
  }
}
