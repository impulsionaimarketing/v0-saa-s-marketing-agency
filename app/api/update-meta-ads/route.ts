import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Update Meta Ads API route called')
    const body = await request.json()
    console.log('[v0] Request body:', body)
    
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_UPDATE_WEBHOOK_URL || process.env.WEBHOOK_URL
    console.log('[v0] Webhook URL configured:', !!webhookUrl)
    
    if (!webhookUrl) {
      console.error('[v0] No webhook URL found in environment variables')
      return NextResponse.json(
        { error: 'Webhook URL não configurada. Adicione NEXT_PUBLIC_N8N_UPDATE_WEBHOOK_URL nas variáveis de ambiente.' },
        { status: 500 }
      )
    }

    // Faz a requisição para o n8n do lado do servidor (sem CORS)
    console.log('[v0] Calling n8n webhook...')
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update_meta_ads_data',
        date_range: body.date_range,
        timestamp: new Date().toISOString(),
      }),
    })

    console.log('[v0] N8N response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] N8N error response:', errorText)
      throw new Error(`N8N returned status ${response.status}: ${errorText}`)
    }

    const data = await response.json().catch(() => ({}))

    return NextResponse.json({
      success: true,
      message: 'Atualização solicitada com sucesso',
      data,
    })
  } catch (error) {
    console.error('[v0] Error calling n8n webhook:', error)
    return NextResponse.json(
      { error: 'Erro ao solicitar atualização' },
      { status: 500 }
    )
  }
}
