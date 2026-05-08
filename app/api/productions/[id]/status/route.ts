import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWebhookNotification } from '@/lib/webhooks/send-notification'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status: newStatus } = await request.json()
    const productionId = params.id

    if (!newStatus) {
      return NextResponse.json({ error: 'Status é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current production to capture old status
    const { data: currentProd, error: fetchError } = await supabase
      .from('productions')
      .select('*')
      .eq('id', productionId)
      .single()

    if (fetchError || !currentProd) {
      return NextResponse.json({ error: 'Produção não encontrada' }, { status: 404 })
    }

    const oldStatus = currentProd.status

    // Update production status
    const { data: updatedProd, error: updateError } = await supabase
      .from('productions')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', productionId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating production status:', updateError)
      return NextResponse.json({ error: 'Falha ao atualizar status' }, { status: 500 })
    }

    // Insert into production_status_history
    const { error: historyError } = await supabase
      .from('production_status_history')
      .insert({
        production_id: productionId,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: 'current-user', // TODO: get from auth
        changed_at: new Date().toISOString()
      })

    if (historyError) {
      console.error('Error inserting history:', historyError)
      // Don't fail the request, just log
    }

    // Send webhook notification
    try {
      await sendWebhookNotification('production.status_changed', {
        production_id: productionId,
        old_status: oldStatus,
        new_status: newStatus,
        changed_at: new Date().toISOString(),
        changed_by: 'current-user'
      })
    } catch (webhookError) {
      console.error('Webhook error:', webhookError)
      // Don't fail the request
    }

    return NextResponse.json(updatedProd)
  } catch (error: any) {
    console.error('Error in status update:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}