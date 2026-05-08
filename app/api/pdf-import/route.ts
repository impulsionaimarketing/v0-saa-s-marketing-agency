import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    console.log('[v0] Processing PDF import:', {
      clientId: data.client_id,
      clientName: data.client_name,
      month: data.month,
      year: data.year,
      convertToDemand: data.convert_to_demand,
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

    console.log('[v0] n8n response status:', n8nResponse.status, n8nResponse.statusText)

    if (!n8nResponse.ok) {
      console.error('[v0] n8n error:', n8nResponse.statusText)
      return NextResponse.json(
        {
          success: false,
          error: `Webhook error: ${n8nResponse.statusText}`,
          resumo: 'Erro ao processar o PDF',
        },
        { status: 200 } // Return 200 even on error for consistency
      )
    }

    const result = await n8nResponse.json()
    console.log('[v0] n8n response:', result)

    // Ensure response has success field
    const response = {
      success: result.success !== false,
      resumo: result.resumo || result.message || 'Importação concluída com sucesso!',
      data: result,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[v0] PDF import error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao processar PDF',
        resumo: error instanceof Error ? error.message : 'Erro desconhecido',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 } // Return 200 for consistency
    )
  }
}
