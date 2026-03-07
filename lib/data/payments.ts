"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"

export interface Payment {
  id: string
  client_id: string
  due_date: string
  amount: number
  is_paid: boolean
  paid_date: string | null
}

export async function getPayments(clientId?: string): Promise<Payment[]> {
  try {
    const supabase = await createSupabaseClient()

    let query = supabase.from("payments").select("*").order("due_date", { ascending: true })

    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching payments:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[v0] Error fetching payments:", error)
    return []
  }
}

export async function generatePaymentsForClient(
  clientId: string,
  paymentFrequency: string,
  contractStartDate: string,
  contractEndDate: string,
  monthlyValue: number
): Promise<Payment[]> {
  try {
    const supabase = await createSupabaseClient()

    // Check if payments already exist for this client
    const { data: existingPayments, error: fetchError } = await supabase
      .from("payments")
      .select("id")
      .eq("client_id", clientId)

    if (fetchError) {
      console.error("[v0] Error checking existing payments:", fetchError)
      return []
    }

    // If payments already exist, don't generate new ones
    if (existingPayments && existingPayments.length > 0) {
      return getPayments(clientId)
    }

    // Generate payment schedule
    const payments: Omit<Payment, "id">[] = []
    const startDate = new Date(contractStartDate)
    const endDate = new Date(contractEndDate)
    let currentDate = new Date(startDate)

    const frequencyDays: { [key: string]: number } = {
      "Semanal": 7,
      "Quinzenal": 15,
      "Mensal": 30,
      "Bimestral": 60,
      "Trimestral": 90,
      "Anual": 365,
    }

    const daysToAdd = frequencyDays[paymentFrequency] || 30

    while (currentDate <= endDate) {
      payments.push({
        client_id: clientId,
        due_date: currentDate.toISOString().split("T")[0],
        amount: monthlyValue,
        is_paid: false,
        paid_date: null,
      })

      currentDate.setDate(currentDate.getDate() + daysToAdd)
    }

    // Insert payments into database
    if (payments.length > 0) {
      const { error: insertError } = await supabase.from("payments").insert(payments)

      if (insertError) {
        console.error("[v0] Error inserting payments:", insertError)
        return []
      }
    }

    return getPayments(clientId)
  } catch (error) {
    console.error("[v0] Error generating payments:", error)
    return []
  }
}

export async function togglePayment(
  paymentId: string,
  isPaid: boolean
): Promise<Payment | null> {
  try {
    const supabase = await createSupabaseClient()

    const { data, error } = await supabase
      .from("payments")
      .update({
        is_paid: isPaid,
        paid_date: isPaid ? new Date().toISOString().split("T")[0] : null,
      })
      .eq("id", paymentId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error toggling payment:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("[v0] Error toggling payment:", error)
    return null
  }
}

export async function deletePaymentsForClient(clientId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseClient()

    const { error } = await supabase.from("payments").delete().eq("client_id", clientId)

    if (error) {
      console.error("[v0] Error deleting payments:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[v0] Error deleting payments:", error)
    return false
  }
}
