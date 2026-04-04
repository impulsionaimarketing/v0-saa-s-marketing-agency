import { NextRequest, NextResponse } from "next/server"
import { getAdminMessaging } from "@/lib/firebase/admin"
import { tokenStore } from "../subscribe/route"

interface SendNotificationBody {
  title: string
  body: string
  url?: string
  tokens?: string[]  // If not provided, send to all stored tokens
  topic?: string     // Send to a topic instead of specific tokens
  data?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key for security
    const apiKey = request.headers.get("x-api-key")
    const expectedKey = process.env.NOTIFICATIONS_API_KEY

    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body: SendNotificationBody = await request.json()
    const { title, body: messageBody, url, tokens, topic, data } = body

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: "Título e corpo da mensagem são obrigatórios" },
        { status: 400 }
      )
    }

    const messaging = getAdminMessaging()

    // Prepare notification payload
    const notification = {
      title,
      body: messageBody,
    }

    const messageData = {
      ...data,
      url: url || "/",
      timestamp: Date.now().toString(),
    }

    // Send to topic
    if (topic) {
      const response = await messaging.send({
        topic,
        notification,
        data: messageData,
        webpush: {
          fcmOptions: {
            link: url || "/",
          },
        },
      })

      return NextResponse.json({
        success: true,
        messageId: response,
        sentTo: `topic:${topic}`,
      })
    }

    // Get target tokens
    const targetTokens = tokens || Array.from(tokenStore)

    if (targetTokens.length === 0) {
      return NextResponse.json(
        { error: "Nenhum token de destino disponível" },
        { status: 400 }
      )
    }

    // Send to multiple tokens
    const response = await messaging.sendEachForMulticast({
      tokens: targetTokens,
      notification,
      data: messageData,
      webpush: {
        fcmOptions: {
          link: url || "/",
        },
      },
    })

    // Handle invalid tokens
    const invalidTokens: string[] = []
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code
        if (
          errorCode === "messaging/invalid-registration-token" ||
          errorCode === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(targetTokens[idx])
          tokenStore.delete(targetTokens[idx])
        }
      }
    })

    console.log(`[Notifications] Enviadas: ${response.successCount}, Falhas: ${response.failureCount}`)

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokensRemoved: invalidTokens.length,
    })
  } catch (error) {
    console.error("[Notifications] Erro ao enviar notificação:", error)
    return NextResponse.json(
      { error: "Falha ao enviar notificação" },
      { status: 500 }
    )
  }
}
