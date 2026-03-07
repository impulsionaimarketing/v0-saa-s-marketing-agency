'use server'

import { 
  getPayments, 
  createPayment, 
  updatePayment, 
  deletePayment, 
  markPaymentAsPaid,
  markPaymentAsUnpaid,
  type Payment 
} from '@/lib/data/payments'
import { getClients } from '@/lib/data/clients'
import { createClient } from '@/lib/supabase/server'

export async function getPaymentsAction() {
  return await getPayments()
}

export async function createPaymentAction(data: Omit<Payment, 'id' | 'created_at' | 'client_name'>) {
  return await createPayment(data)
}

export async function updatePaymentAction(id: string, data: Partial<Payment>) {
  return await updatePayment(id, data)
}

export async function deletePaymentAction(id: string) {
  return await deletePayment(id)
}

export async function getClientsAction(filters?: { status?: string }) {
  return await getClients(filters || {})
}

export async function markPaymentAsPaidAction(id: string, paidDate: string) {
  return await markPaymentAsPaid(id, paidDate)
}

export async function markPaymentAsUnpaidAction(id: string) {
  return await markPaymentAsUnpaid(id)
}

export async function generateMonthlyPaymentsAction(month: number, year: number) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('generate_monthly_payments', {
    p_month: month,
    p_year: year
  })

  if (error) {
    throw new Error(error.message)
  }

  return data[0]
}
