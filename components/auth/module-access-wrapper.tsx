'use client'

import { ReactNode } from 'react'
import { useModuleAccess } from '@/lib/hooks/use-module-access'
import { AccessDenied } from '@/components/auth/access-denied'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ModuleAccessWrapperProps {
  moduleName: string
  moduleDisplayName?: string
  children: ReactNode
}

export function ModuleAccessWrapper({
  moduleName,
  moduleDisplayName,
  children,
}: ModuleAccessWrapperProps) {
  const { canView, isLoading, isBlocked } = useModuleAccess(moduleName)

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isBlocked || !canView) {
    return <AccessDenied moduleName={moduleDisplayName || moduleName} />
  }

  return <>{children}</>
}
