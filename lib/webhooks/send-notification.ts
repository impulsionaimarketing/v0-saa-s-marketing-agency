'use server'

export type WebhookEvent = 
  | 'client.created'
  | 'client.updated'
  | 'client.deleted'
  | 'production.created'
  | 'production.updated'
  | 'production.deleted'
  | 'production.status_changed'
  | 'payment.created'
  | 'payment.updated'
  | 'payment.status_changed'
  | 'demand.created'
  | 'demand.updated'
  | 'demand.deleted'
  | 'collaborator.created'
  | 'collaborator.updated'
  | 'report.created'
  | 'approval.approved'
  | 'approval.adjustment_requested'

interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: any
  metadata?: {
    user_id?: string
    ip_address?: string
    [key: string]: any
  }
}

/**
 * Sends a webhook notification for a database change
 * @param event - The type of event that occurred
 * @param data - The data associated with the event
 * @param metadata - Optional metadata (user info, etc)
 */
export async function sendWebhookNotification(
  event: WebhookEvent,
  data: any,
  metadata?: WebhookPayload['metadata']
) {
  const webhookUrl = process.env.WEBHOOK_URL

  // Skip if no webhook URL configured
  if (!webhookUrl) {
    console.log('[v0] Webhook URL not configured, skipping notification')
    return
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
    metadata,
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('[v0] Webhook failed:', response.status, response.statusText)
    } else {
      console.log('[v0] Webhook sent successfully:', event)
    }
  } catch (error) {
    console.error('[v0] Error sending webhook:', error)
    // Don't throw - webhook failures shouldn't break the app
  }
}

/**
 * Sends a batch of webhook notifications
 * Useful for bulk operations
 */
export async function sendBatchWebhookNotification(
  events: Array<{ event: WebhookEvent; data: any; metadata?: WebhookPayload['metadata'] }>
) {
  const webhookUrl = process.env.WEBHOOK_URL

  if (!webhookUrl) {
    console.log('[v0] Webhook URL not configured, skipping notifications')
    return
  }

  const payload = {
    batch: true,
    timestamp: new Date().toISOString(),
    events: events.map(({ event, data, metadata }) => ({
      event,
      data,
      metadata,
    })),
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('[v0] Batch webhook failed:', response.status, response.statusText)
    } else {
      console.log('[v0] Batch webhook sent successfully:', events.length, 'events')
    }
  } catch (error) {
    console.error('[v0] Error sending batch webhook:', error)
  }
}
