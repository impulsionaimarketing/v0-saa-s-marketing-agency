"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react"
import { usePushNotifications } from "@/lib/hooks/use-push-notifications"
import { toast } from "sonner"

export function NotificationButton() {
  const { 
    permission, 
    isLoading, 
    error, 
    requestPermission, 
    onForegroundMessage 
  } = usePushNotifications()

  useEffect(() => {
    if (permission !== "granted") return

    const unsubscribe = onForegroundMessage((payload) => {
      toast(payload.notification?.title || "Nova notificação", {
        description: payload.notification?.body,
      })
    })

    return unsubscribe
  }, [permission, onForegroundMessage])

  useEffect(() => {
    if (error) {
      toast.error("Erro nas notificações", {
        description: error,
      })
    }
  }, [error])

  const handleClick = async () => {
    const token = await requestPermission()
    if (token) {
      toast.success("Notificações ativadas", {
        description: "Você receberá notificações importantes.",
      })
    }
  }

  if (permission === "unsupported") {
    return null
  }

  if (permission === "granted") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        disabled
        title="Notificações ativadas"
      >
        <BellRing className="h-5 w-5 text-primary" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full" />
      </Button>
    )
  }

  if (permission === "denied") {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        title="Notificações bloqueadas nas configurações do navegador"
      >
        <BellOff className="h-5 w-5 text-muted-foreground" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isLoading}
      title="Ativar notificações"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Bell className="h-5 w-5" />
      )}
    </Button>
  )
}
