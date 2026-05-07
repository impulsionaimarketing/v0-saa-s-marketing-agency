import { type NextRequest, NextResponse } from 'next/server'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.impulsionaimarketing.com.br/webhook/agente-ia'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  message: string
  history?: ChatMessage[]
}

/**
 * POST /api/agent-chat
 * Proxy para o webhook do n8n que processa as mensagens do assistente IA
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    console.log('[AgentChat] Sending message to n8n:', {
      timestamp: new Date().toISOString(),
      message: body.message.substring(0, 100) + (body.message.length > 100 ? '...' : ''),
      historyLength: body.history?.length || 0,
    })

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: body.message,
        history: body.history || [],
      }),
    })

    if (!response.ok) {
      console.error('[AgentChat] n8n webhook error:', {
        status: response.status,
        statusText: response.statusText,
      })
      return NextResponse.json(
        { 
          error: 'Failed to get response from AI agent',
          response: 'Desculpe, não consegui processar sua solicitação. Tente novamente.',
        },
        { status: 502 }
      )
    }

    const data = await response.json()

    console.log('[AgentChat] Response from n8n:', {
      timestamp: new Date().toISOString(),
      hasResponse: !!data.response,
      hasOutput: !!data.output,
      hasText: !!data.text,
    })

    // Normaliza a resposta - o n8n pode retornar em diferentes formatos
    const aiResponse = data.response || data.output || data.text || data.message || 'Não consegui processar sua solicitação.'

    return NextResponse.json({
      response: aiResponse,
      success: true,
    })
  } catch (error) {
    console.error('[AgentChat] Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        response: 'Erro ao conectar com o assistente. Tente novamente.',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/agent-chat
 * Health check para verificar se a API está funcionando
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    webhookUrl: N8N_WEBHOOK_URL ? 'configured' : 'not configured',
    timestamp: new Date().toISOString(),
  })
}
