'use server'

import { createClient } from '@/lib/supabase/server'

export interface OnboardingTask {
  id: string
  title: string
  completed: boolean
  completed_at?: string | null
  order: number
}

export interface MonthlyPlan {
  id: string
  month: number
  year: number
  content: string
}

// Get onboarding tasks for a client
export async function getOnboardingTasks(clientId: string): Promise<OnboardingTask[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('client_onboarding_tasks')
      .select('*')
      .eq('client_id', clientId)
      .order('order', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
  } catch (error) {
    console.error('[v0] Error fetching onboarding tasks:', error)
    throw error
  }
}

// Toggle onboarding task completion
export async function toggleOnboardingTask(taskId: string, completed: boolean): Promise<OnboardingTask> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('client_onboarding_tasks')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  } catch (error) {
    console.error('[v0] Error toggling task:', error)
    throw error
  }
}

// Get monthly plan for a client
export async function getMonthlyPlan(clientId: string, month: number, year: number): Promise<MonthlyPlan | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('client_monthly_plans')
      .select('*')
      .eq('client_id', clientId)
      .eq('month', month)
      .eq('year', year)
      .single()

    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data || null
  } catch (error) {
    console.error('[v0] Error fetching monthly plan:', error)
    throw error
  }
}

// Create or update monthly plan
export async function saveMonthlyPlan(
  clientId: string,
  month: number,
  year: number,
  content: string
): Promise<MonthlyPlan> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('client_monthly_plans')
      .upsert({
        client_id: clientId,
        month,
        year,
        content,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  } catch (error) {
    console.error('[v0] Error saving monthly plan:', error)
    throw error
  }
}

// Get client by ID
export async function getClientById(clientId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) throw new Error(error.message)
    return data
  } catch (error) {
    console.error('[v0] Error fetching client:', error)
    throw error
  }
}

// Get client meta ads data
export async function getClientMetaAdsData(clientId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('meta_ads_insights_full')
      .select('*')
      .eq('client_id', clientId)
      .order('report_date', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  } catch (error) {
    console.error('[v0] Error fetching client meta ads:', error)
    throw error
  }
}
