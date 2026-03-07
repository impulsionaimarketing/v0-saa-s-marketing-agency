'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function AccessDenied({ moduleName = 'esta página' }: { moduleName?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Acesso Negado</CardTitle>
            <CardDescription className="mt-2">
              Você não tem permissão para acessar {moduleName}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Se você acredita que isto é um erro, entre em contato com o administrador do sistema para verificar suas permissões.
          </p>
          <Link href="/" className="w-full">
            <Button className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
