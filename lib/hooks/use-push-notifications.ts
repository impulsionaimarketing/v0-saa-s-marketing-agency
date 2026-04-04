"use client"

import { useState, useEffect, useCallback } from "react"
import { getToken, onMessage, MessagePayload } from "firebase/messaging"
import { getFirebaseMessaging } from "@/lib/firebase/config"

interface PushNotificationState {
  permission: NotificationPermission | "unsupported"
  token: string | null
  isLoading: boolean
  error: string | null
}

interface UsePushNotificationsReturn extends PushNotificationState {
  requestPermission: () => Promise<string | null>
  onForegroundMessage: (callback: (payload: MessagePayload) => void) => () => void
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushNotificationState>({
    permission: "default",
    token: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    async function checkSupport() {
      if (typeof window === "undefined") {
        setState(prev => ({ ...prev, isLoading: false, permission: "unsupported" }))
        return
      }

      if (!("Notification" in window)) {
        setState(prev => ({ ...prev, isLoading: false, permission: "unsupported" }))
        return
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        permission: Notification.permission 
      }))
    }

    checkSupport()
  }, [])

  const registerServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Workers não suportados")
    }

    // Build the SW URL with Firebase config params
    const params = new URLSearchParams({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    })

    const swUrl = `/firebase-messaging-sw.js?${params.toString()}`
    
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: "/",
    })

    await navigator.serviceWorker.ready
    return registration
  }, [])

  const requestPermission = useCallback(async (): Promise<string | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const permission = await Notification.requestPermission()
      
      if (permission !== "granted") {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          permission,
          error: "Permissão de notificação negada" 
        }))
        return null
      }

      const messaging = await getFirebaseMessaging()
      if (!messaging) {
        throw new Error("Firebase Messaging não disponível")
      }

      const registration = await registerServiceWorker()

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      if (!vapidKey) {
        throw new Error("VAPID key não configurada")
      }

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      })

      if (!token) {
        throw new Error("Falha ao obter token FCM")
      }

      // Send token to backend
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        throw new Error("Falha ao registrar token no servidor")
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        permission: "granted",
        token 
      }))

      return token
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }))
      return null
    }
  }, [registerServiceWorker])

  const onForegroundMessage = useCallback((callback: (payload: MessagePayload) => void) => {
    let unsubscribe: (() => void) | undefined

    async function setup() {
      const messaging = await getFirebaseMessaging()
      if (messaging) {
        unsubscribe = onMessage(messaging, callback)
      }
    }

    setup()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return {
    ...state,
    requestPermission,
    onForegroundMessage,
  }
}
