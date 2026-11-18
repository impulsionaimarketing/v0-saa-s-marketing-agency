'use client'

import { Bell } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePush } from './use-push'

export function NotificationSettings() {
  const { status, busy, error, enable, disable, sendTest } = usePush()

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Notificações neste aparelho</CardTitle>
        </div>
        <CardDescription>Avisos de novas tarefas atribuídas a você</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!status.ready ? null : status.needsInstall ? (
          <p className="text-sm text-muted-foreground">
            No iPhone, primeiro toque em <strong>Compartilhar</strong> e em <strong>Adicionar à Tela de Início</strong>.
            Depois abra o app pelo ícone e volte aqui para ativar.
          </p>
        ) : !status.supported ? (
          <p className="text-sm text-muted-foreground">Este navegador não suporta notificações push.</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={status.subscribed ? 'bg-success/10 text-success border-success/20' : ''}>
                {status.subscribed ? 'Ativadas' : status.permission === 'denied' ? 'Bloqueadas' : 'Desativadas'}
              </Badge>
            </div>
            {status.permission === 'denied' && (
              <p className="text-sm text-muted-foreground">
                As notificações estão bloqueadas. Libere em Ajustes do aparelho → Notificações → Impulsionaí.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {status.subscribed ? (
                <>
                  <Button variant="outline" size="sm" onClick={sendTest}>Enviar teste</Button>
                  <Button variant="outline" size="sm" onClick={disable} disabled={busy}>Desativar</Button>
                </>
              ) : (
                <Button size="sm" onClick={enable} disabled={busy || status.permission === 'denied'}>
                  {busy ? 'Ativando…' : 'Ativar notificações'}
                </Button>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}
