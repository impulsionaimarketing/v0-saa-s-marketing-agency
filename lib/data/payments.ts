import { createClient } from '@/lib/supabase/server'
import { sendWebhookNotification } from '@/lib/webhooks/send-notification'

export interface Payment {
  id: string
  client_id: string | null
  client_name?: string
  due_date: string
  amount: number
  is_paid: boolean
  paid_date: string | null
  payment_method: string | null
  notes: string | null
  created_at: string
}

export async function getPayments(): Promise<Payment[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_all_payments')

    if (error) {
      console.error('[v0] Error fetching payments:', error)
      throw new Error(error.message)
    }

    return (data || []) as Payment[]
  } catch (error) {
    console.error('[v0] Error fetching payments:', error)
    return []
  }
}

export async function createPayment(data: {
  client_id: string | null
  client_name?: string
  due_date: string
  amount: number
  payment_method?: string
  notes?: string
}): Promise<Payment | null> {
  try {
    const supabase = await createClient()
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        client_id: data.client_id,
        client_name: data.client_name || null,
        due_date: data.due_date,
        amount: data.amount,
        payment_method: data.payment_method || null,
        notes: data.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating payment:', error)
      throw new Error(error.message)
    }

    // Send webhook notification
    await sendWebhookNotification('payment.created', payment)

    return payment as Payment
  } catch (error) {
    console.error('[v0] Error creating payment:', error)
    throw error
  }
}

export async function updatePayment(
  id: string,
  data: Partial<Payment>
): Promise<Payment | null> {
  try {
    const supabase = await createClient()
    const { data: payment, error } = await supabase
      .from('payments')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating payment:', error)
      throw new Error(error.message)
    }

    // Send webhook notification
    await sendWebhookNotification('payment.updated', { id, ...payment })

    return payment as Payment
  } catch (error) {
    console.error('[v0] Error updating payment:', error)
    throw error
  }
}

export async function markPaymentAsPaid(
  id: string,
  paid_date: string,
  payment_method?: string
): Promise<Payment | null> {
  try {
    const supabase = await createClient()
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        is_paid: true,
        paid_date: paid_date,
        payment_method: payment_method || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error marking payment as paid:', error)
      throw new Error(error.message)
    }

    // Send webhook notification
    await sendWebhookNotification('payment.paid', payment)

    return payment as Payment
  } catch (error) {
    console.error('[v0] Error marking payment as paid:', error)
    throw error
  }
}

export async function markPaymentAsUnpaid(id: string): Promise<Payment | null> {
  try {
    const supabase = await createClient()
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        is_paid: false,
        paid_date: null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error marking payment as unpaid:', error)
      throw new Error(error.message)
    }

    return payment as Payment
  } catch (error) {
    console.error('[v0] Error marking payment as unpaid:', error)
    throw error
  }
}

export async function deletePayment(id: string): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('payments').delete().eq('id', id)

    if (error) {
      console.error('[v0] Error deleting payment:', error)
      throw new Error(error.message)
    }

    // Send webhook notification
    await sendWebhookNotification('payment.deleted', { id })
  } catch (error) {
    console.error('[v0] Error deleting payment:', error)
    throw error
  }
}
