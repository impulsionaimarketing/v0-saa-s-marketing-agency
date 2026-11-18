'use client'

import { useCallback, useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export type PushStatus = {
  ready: boolean            // já verificou o aparelho
  supported: boolean        // navegador sabe receber push
  needsInstall: boolean     // iPhone/iPad fora da tela de início: push só funciona instalado
  permission: NotificationPermission | 'unsupported'
  subscribed: boolean
}

export function usePush() {
  const [status, setStatus] = useState<PushStatus>({
    ready: false, supported: false, needsInstall: false, permission: 'unsupported', subscribed: false,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const ua = navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

    if (!supported) {
      setStatus({ ready: true, supported: false, needsInstall: isIOS && !standalone, permission: 'unsupported', subscribed: false })
      return
    }
    let subscribed = false
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      subscribed = !!(await reg?.pushManager.getSubscription())
    } catch {}
    setStatus({ ready: true, supported: true, needsInstall: false, permission: Notification.permission, subscribed })
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const enable = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      // A chave vem do servidor (não do build), para nunca ficar presa a um valor antigo
      const keyRes = await fetch('/api/push/public-key', { cache: 'no-store' })
      const keyInfo = await keyRes.json().catch(() => null)
      if (!keyInfo?.valid || !keyInfo.key) {
        throw new Error(
          `A chave de notificações no servidor está inválida (${keyInfo?.bytes ?? 0} bytes; o esperado é 65). ` +
          'Corrija NEXT_PUBLIC_VAPID_PUBLIC_KEY na Vercel e faça um novo deploy.',
        )
      }
      const publicKey: string = keyInfo.key
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') throw new Error('Permissão negada. Ative as notificações nos ajustes do aparelho.')

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const subscription =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }))

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Não foi possível registrar este aparelho.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao ativar notificações')
    } finally {
      setBusy(false)
      refresh()
    }
  }, [refresh])

  const disable = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const subscription = await reg?.pushManager.getSubscription()
      if (subscription) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao desativar')
    } finally {
      setBusy(false)
      refresh()
    }
  }, [refresh])

  const sendTest = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/push/test', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!data.success) setError('Não foi possível enviar o teste. Ative as notificações neste aparelho primeiro.')
  }, [])

  return { status, busy, error, enable, disable, sendTest }
}
