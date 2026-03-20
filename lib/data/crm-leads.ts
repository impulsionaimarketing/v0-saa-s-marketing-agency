import { createClient } from '@/lib/supabase/client'

export type LeadStatus = 
  | 'lead_novo'
  | 'entrar_em_contato'
  | 'proposta_enviada'
  | 'contrato_ativo'
  | 'contrato_pausado'
  | 'contrato_cancelado'

export interface CrmLead {
  id: string
  name: string
  phone: string | null
  email: string | null
  company: string | null
  status: LeadStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateLeadData {
  name: string
  phone?: string
  email?: string
  company?: string
  status?: LeadStatus
  notes?: string
}

export interface UpdateLeadData {
  name?: string
  phone?: string
  email?: string
  company?: string
  status?: LeadStatus
  notes?: string
}

export async function getCrmLeads(): Promise<CrmLead[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('crm_leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching CRM leads:', error)
    throw error
  }

  return data || []
}

export async function getCrmLeadById(id: string): Promise<CrmLead | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[v0] Error fetching CRM lead:', error)
    return null
  }

  return data
}

export async function createCrmLead(leadData: CreateLeadData): Promise<CrmLead> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('crm_leads')
    .insert({
      name: leadData.name,
      phone: leadData.phone || null,
      email: leadData.email || null,
      company: leadData.company || null,
      status: leadData.status || 'lead_novo',
      notes: leadData.notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[v0] Error creating CRM lead:', error)
    throw error
  }

  return data
}

export async function updateCrmLead(id: string, leadData: UpdateLeadData): Promise<CrmLead> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('crm_leads')
    .update(leadData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error updating CRM lead:', error)
    throw error
  }

  return data
}

export async function updateCrmLeadStatus(id: string, status: LeadStatus): Promise<CrmLead> {
  return updateCrmLead(id, { status })
}

export async function deleteCrmLead(id: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('crm_leads')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[v0] Error deleting CRM lead:', error)
    throw error
  }
}
