'use client'

import { useModuleAccess } from '@/lib/hooks/use-module-access'

export function useCanEdit(moduleName: string): boolean {
  const { canEdit, isBlocked } = useModuleAccess(moduleName)
  return canEdit && !isBlocked
}
