'use client'

import { useEffect, useState } from 'react'
import { Bell, X, Share, SquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePush } from './use-push'

const DISMISS_KEY = 'push-banner-dismissed'

// Convite para ativar notificações; aparece para todos os usuários, em qualquer página
export function NotificationBanner() {
  const { status, busy, error, enable } = usePush()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  const dismiss = () => {
    setDismissed(true)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  if (!status.ready || dismissed || status.subscribed || status.permission === 'denied') return null
  if (!status.supported && !status.needsInstall) return null

  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        {status.needsInstall ? (
          <>
            <p className="font-medium">Receba suas tarefas no iPhone</p>
            <p className="mt-0.5 text-muted-foreground">
              Toque em <Share className="mx-0.5 inline h-3.5 w-3.5" /> <strong>Compartilhar</strong> e depois em{' '}
              <SquarePlus className="mx-0.5 inline h-3.5 w-3.5" /> <strong>Adicionar à Tela de Início</strong>. Abra o app
              pelo ícone e ative as notificações.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">Ative as notificações</p>
            <p className="mt-0.5 text-muted-foreground">Receba um aviso aqui quando uma tarefa for atribuída a você.</p>
            {error && <p className="mt-1 text-destructive">{error}</p>}
            <Button size="sm" className="mt-2" onClick={enable} disabled={busy}>
              {busy ? 'Ativando…' : 'Ativar notificações'}
            </Button>
          </>
        )}
      </div>
      <button type="button" onClick={dismiss} aria-label="Dispensar" className="shrink-0 text-muted-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
