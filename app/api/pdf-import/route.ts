import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    console.log('[v0] Processing PDF import:', {
      clientId: data.client_id,
      clientName: data.client_name,
      month: data.month,
      year: data.year,
    })

    // Call n8n webhook
    const n8nResponse = await fetch(
      'https://n8n.impulsionaimarketing.com.br/webhook/cronograma-importarpdf',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    )

    if (!n8nResponse.ok) {
      console.error('[v0] n8n error:', n8nResponse.statusText)
      throw new Error(`Webhook error: ${n8nResponse.statusText}`)
    }

    const result = await n8nResponse.json()
    console.log('[v0] n8n response:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] PDF import error:', error)
    return NextResponse.json(
      {
        error: 'Erro ao processar PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
