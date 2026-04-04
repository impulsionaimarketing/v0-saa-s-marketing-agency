"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if already dismissed in this session
    const dismissed = sessionStorage.getItem("pwa-install-dismissed")
    if (dismissed) {
      setIsDismissed(true)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstallable(false)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setIsInstallable(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem("pwa-install-dismissed", "true")
  }

  if (!isInstallable || isDismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3 shadow-lg">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Instalar aplicativo</p>
          <p className="text-xs text-muted-foreground truncate">
            Acesse rapidamente pelo seu dispositivo
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDismiss}
            aria-label="Dispensar"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleInstall}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Instalar
          </Button>
        </div>
      </div>
    </div>
  )
}
