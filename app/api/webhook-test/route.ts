import { type NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint to verify webhook configuration
 * POST /api/webhook-test
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('[v0] Webhook test received:', {
      timestamp: new Date().toISOString(),
      body,
    })

    return NextResponse.json({
      success: true,
      message: 'Webhook received successfully',
      received: body,
    })
  } catch (error) {
    console.error('[v0] Webhook test error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check webhook status
 */
export async function GET() {
  const webhookUrl = process.env.WEBHOOK_URL
  const hasSecret = !!process.env.WEBHOOK_SECRET

  return NextResponse.json({
    configured: !!webhookUrl,
    url: webhookUrl ? '***configured***' : 'not configured',
    hasSecret,
    instructions: 'Add WEBHOOK_URL and WEBHOOK_SECRET environment variables',
  })
}
