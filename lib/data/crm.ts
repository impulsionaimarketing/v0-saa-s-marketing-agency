"use server"

import { createClient } from "@/lib/supabase/server"

// =============================================
// TYPES
// =============================================

export interface CRMPipeline {
  id: string
  name: string
  color: string
  position: number
  created_at: string
  updated_at: string
}

export interface CRMColumn {
  id: string
  pipeline_id: string
  name: string
  color: string
  position: number
  lead_limit: number | null
  created_at: string
  updated_at: string
}

export interface CRMTag {
  id: string
  name: string
  color: string
  created_at: string
}

export interface CRMCustomField {
  id: string
  pipeline_id: string | null
  name: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'url' | 'whatsapp' | 'email'
  options: string[]
  position: number
  required: boolean
  created_at: string
}

export interface CRMLeadTag {
  id: string
  lead_id: string
  tag_id: string
  tag?: CRMTag
}

export interface CRMCustomValue {
  id: string
  lead_id: string
  field_id: string
  value: string | null
  field?: CRMCustomField
}

export interface CRMActivityHistory {
  id: string
  lead_id: string
  action: string
  description: string | null
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  created_at: string
}

export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface CRMLeadV2 {
  id: string
  pipeline_id: string
  column_id: string
  name: string
  company: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  value: number
  priority: LeadPriority
  assigned_to: string | null
  notes: string | null
  position: number
  created_at: string
  updated_at: string
  // Relations
  tags?: CRMTag[]
  custom_values?: CRMCustomValue[]
  column?: CRMColumn
}

export const PRIORITY_CONFIG: Record<LeadPriority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-slate-500/20 text-slate-500 border-slate-500/30' },
  medium: { label: 'Média', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
  high: { label: 'Alta', color: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
  urgent: { label: 'Urgente', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
}

// =============================================
// PIPELINES (FUNIS)
// =============================================

export async function getPipelines(): Promise<CRMPipeline[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('crm_pipelines')
    .select('*')
    .order('position', { ascending: true })

  if (error) {
    console.error('[CRM] Error fetching pipelines:', error)
    return []
  }
  return data || []
}

export async function getPipeline(id: string): Promise<CRMPipeline | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('crm_pipelines')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[CRM] Error fetching pipeline:', error)
    return null
  }
  return data
}

export async function createPipeline(data: { name: string; color?: string }): Promise<CRMPipeline | null> {
  const supabase = await createClient()
  
  // Get max position
  const { data: pipelines } = await supabase
    .from('crm_pipelines')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
  
  const position = pipelines?.[0]?.position ?? -1

  const { data: result, error } = await supabase
    .from('crm_pipelines')
    .insert({ name: data.name, color: data.color || '#3b82f6', position: position + 1 })
    .select('*')
    .single()

  if (error) {
    console.error('[CRM] Error creating pipeline:', error)
    throw error
  }
  return result
}

export async function updatePipeline(id: string, data: Partial<Pick<CRMPipeline, 'name' | 'color' | 'position'>>): Promise<CRMPipeline | null> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('crm_pipelines')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[CRM] Error updating pipeline:', error)
    throw error
  }
  return result
}

export async function deletePipeline(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('crm_pipelines').delete().eq('id', id)
  if (error) {
    console.error('[CRM] Error deleting pipeline:', error)
    throw error
  }
}

export async function duplicatePipeline(id: string): Promise<CRMPipeline | null> {
  const supabase = await createClient()
  
  // Get original pipeline
  const { data: original } = await supabase
    .from('crm_pipelines')
    .select('*')
    .eq('id', id)
    .single()

  if (!original) return null

  // Create new pipeline
  const newPipeline = await createPipeline({ 
    name: `${original.name} (Cópia)`, 
    color: original.color 
  })

  if (!newPipeline) return null

  // Get columns from original
  const { data: columns } = await supabase
    .from('crm_columns')
    .select('*')
    .eq('pipeline_id', id)
    .order('position')

  // Create columns for new pipeline
  if (columns && columns.length > 0) {
    await supabase.from('crm_columns').insert(
      columns.map(col => ({
        pipeline_id: newPipeline.id,
        name: col.name,
        color: col.color,
        position: col.position,
        lead_limit: col.lead_limit,
      }))
    )
  }

  return newPipeline
}

// =============================================
// COLUMNS (COLUNAS/ETAPAS)
// =============================================

export async function getColumns(pipelineId: string): Promise<CRMColumn[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('crm_columns')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('position', { ascending: true })

  if (error) {
    console.error('[CRM] Error fetching columns:', error)
    return []
  }
  return data || []
}

export async function createColumn(data: { 
  pipeline_id: string
  name: string
  color?: string
  lead_limit?: number | null
}): Promise<CRMColumn | null> {
  const supabase = await createClient()
  
  // Get max position
  const { data: columns } = await supabase
    .from('crm_columns')
    .select('position')
    .eq('pipeline_id', data.pipeline_id)
    .order('position', { ascending: false })
    .limit(1)
  
  const position = columns?.[0]?.position ?? -1

  const { data: result, error } = await supabase
    .from('crm_columns')
    .insert({ 
      pipeline_id: data.pipeline_id,
      name: data.name, 
      color: data.color || '#6b7280', 
      position: position + 1,
      lead_limit: data.lead_limit || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[CRM] Error creating column:', error)
    throw error
  }
  return result
}

export async function updateColumn(id: string, data: Partial<Pick<CRMColumn, 'name' | 'color' | 'position' | 'lead_limit'>>): Promise<CRMColumn | null> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('crm_columns')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[CRM] Error updating column:', error)
    throw error
  }
  return result
}

export async function deleteColumn(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('crm_columns').delete().eq('id', id)
  if (error) {
    console.error('[CRM] Error deleting column:', error)
    throw error
  }
}

export async function reorderColumns(columnIds: string[]): Promise<void> {
  const supabase = await createClient()
  
  const updates = columnIds.map((id, index) => 
    supabase
      .from('crm_columns')
      .update({ position: index, updated_at: new Date().toISOString() })
      .eq('id', id)
  )

  await Promise.all(updates)
}

// =============================================
// TAGS
// =============================================

export async function getTags(): Promise<CRMTag[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('crm_tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('[CRM] Error fetching tags:', error)
    return []
  }
  return data || []
}

export async function createTag(data: { name: string; color?: string }): Promise<CRMTag | null> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('crm_tags')
    .insert({ name: data.name, color: data.color || '#3b82f6' })
    .select('*')
    .single()

  if (error) {
    console.error('[CRM] Error creating tag:', error)
    throw error
  }
  return result
}

export async function updateTag(id: string, data: Partial<Pick<CRMTag, 'name' | 'color'>>): Promise<CRMTag | null> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('crm_tags')
    .update(data)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[CRM] Error updating tag:', error)
    throw error
  }
  return result
}

export async function deleteTag(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('crm_tags').delete().eq('id', id)
  if (error) {
    console.error('[CRM] Error deleting tag:', error)
    throw error
  }
}

// =============================================
// CUSTOM FIELDS (CAMPOS PERSONALIZADOS)
// =============================================

export async function getCustomFields(pipelineId?: string): Promise<CRMCustomField[]> {
  const supabase = await createClient()
  let query = supabase
    .from('crm_custom_fields')
    .select('*')
    .order('position', { ascending: true })

  if (pipelineId) {
    query = query.or(`pipeline_id.eq.${pipelineId},pipeline_id.is.null`)
  }

  const { data, error } = await query

  if (error) {
    console.error('[CRM] Error fetching custom fields:', error)
    return []
  }
  return data || []
}

export async function createCustomField(data: {
  pipeline_id?: string | null
  name: string
  field_type: CRMCustomField['field_type']
  options?: string[]
  required?: boolean
}): Promise<CRMCustomField | null> {
  const supabase = await createClient()
  
  // Get max position
  const { data: fields } = await supabase
    .from('crm_custom_fields')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
  
  const position = fields?.[0]?.position ?? -1

  const { data: result, error } = await supabase
    .from('crm_custom_fields')
    .insert({ 
      pipeline_id: data.pipeline_id || null,
      name: data.name, 
      field_type: data.field_type,
      options: data.options || [],
      position: position + 1,
      required: data.required || false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[CRM] Error creating custom field:', error)
    throw error
  }
  return result
}

export async function updateCustomField(id: string, data: Partial<Pick<CRMCustomField, 'name' | 'field_type' | 'options' | 'position' | 'required'>>): Promise<CRMCustomField | null> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('crm_custom_fields')
    .update(data)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[CRM] Error updating custom field:', error)
    throw error
  }
  return result
}

export async function deleteCustomField(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('crm_custom_fields').delete().eq('id', id)
  if (error) {
    console.error('[CRM] Error deleting custom field:', error)
    throw error
  }
}

// =============================================
// LEADS
// =============================================

export async function getLeads(pipelineId: string, filters?: {
  columnId?: string
  search?: string
  tagIds?: string[]
  priority?: LeadPriority
  assignedTo?: string
}): Promise<CRMLeadV2[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('crm_leads_v2')
    .select(`
      *,
      column:crm_columns!column_id(id, name, color)
    `)
    .eq('pipeline_id', pipelineId)
    .order('position', { ascending: true })

  if (filters?.columnId) {
    query = query.eq('column_id', filters.columnId)
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority)
  }

  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo)
  }

  const { data, error } = await query

  if (error) {
    console.error('[CRM] Error fetching leads:', error)
    return []
  }

  // Get tags for each lead
  const leads = data || []
  if (leads.length > 0) {
    const leadIds = leads.map(l => l.id)
    const { data: leadTags } = await supabase
      .from('crm_lead_tags')
      .select('lead_id, tag:crm_tags(*)')
      .in('lead_id', leadIds)

    // Map tags to leads
    leads.forEach(lead => {
      lead.tags = leadTags
        ?.filter(lt => lt.lead_id === lead.id)
        .map(lt => lt.tag as CRMTag) || []
    })
  }

  // Filter by tags if specified
  if (filters?.tagIds && filters.tagIds.length > 0) {
    return leads.filter(lead => 
      lead.tags?.some(tag => filters.tagIds!.includes(tag.id))
    )
  }

  return leads
}

export async function getLead(id: string): Promise<CRMLeadV2 | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('crm_leads_v2')
    .select(`
      *,
      column:crm_columns!column_id(id, name, color)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('[CRM] Error fetching lead:', error)
    return null
  }

  // Get tags
  const { data: leadTags } = await supabase
    .from('crm_lead_tags')
    .select('tag:crm_tags(*)')
    .eq('lead_id', id)

  // Get custom values
  const { data: customValues } = await supabase
    .from('crm_lead_custom_values')
    .select('*, field:crm_custom_fields(*)')
    .eq('lead_id', id)

  return {
    ...data,
    tags: leadTags?.map(lt => lt.tag as CRMTag) || [],
    custom_values: customValues || [],
  }
}

export async function createLead(data: {
  pipeline_id: string
  column_id: string
  name: string
  company?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  value?: number
  priority?: LeadPriority
  assigned_to?: string | null
  notes?: string | null
  tag_ids?: string[]
}): Promise<CRMLeadV2 | null> {
  const supabase = await createClient()
  
  // Get max position in column
  const { data: leads } = await supabase
    .from('crm_leads_v2')
    .select('position')
    .eq('column_id', data.column_id)
    .order('position', { ascending: false })
    .limit(1)
  
  const position = leads?.[0]?.position ?? -1

  const { data: result, error } = await supabase
    .from('crm_leads_v2')
    .insert({ 
      pipeline_id: data.pipeline_id,
      column_id: data.column_id,
      name: data.name, 
      company: data.company || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      value: data.value || 0,
      priority: data.priority || 'medium',
      assigned_to: data.assigned_to || null,
      notes: data.notes || null,
      position: position + 1,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[CRM] Error creating lead:', error)
    throw error
  }

  // Add tags
  if (data.tag_ids && data.tag_ids.length > 0) {
    await supabase.from('crm_lead_tags').insert(
      data.tag_ids.map(tag_id => ({ lead_id: result.id, tag_id }))
    )
  }

  // Log activity
  await logActivity(result.id, 'lead_created', 'Lead criado')

  return result
}

export async function updateLead(id: string, data: Partial<Omit<CRMLeadV2, 'id' | 'created_at' | 'tags' | 'custom_values' | 'column'>> & { tag_ids?: string[] }): Promise<CRMLeadV2 | null> {
  const supabase = await createClient()
  
  // Get old data for history
  const { data: oldLead } = await supabase
    .from('crm_leads_v2')
    .select('*, column:crm_columns!column_id(name)')
    .eq('id', id)
    .single()

  const { tag_ids, ...updateData } = data
  
  const { data: result, error } = await supabase
    .from('crm_leads_v2')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[CRM] Error updating lead:', error)
    throw error
  }

  // Update tags if provided
  if (tag_ids !== undefined) {
    await supabase.from('crm_lead_tags').delete().eq('lead_id', id)
    if (tag_ids.length > 0) {
      await supabase.from('crm_lead_tags').insert(
        tag_ids.map(tag_id => ({ lead_id: id, tag_id }))
      )
    }
  }

  // Log column change
  if (data.column_id && oldLead && data.column_id !== oldLead.column_id) {
    const { data: newColumn } = await supabase
      .from('crm_columns')
      .select('name')
      .eq('id', data.column_id)
      .single()

    await logActivity(
      id, 
      'stage_changed', 
      `Movido de "${oldLead.column?.name}" para "${newColumn?.name}"`,
      oldLead.column?.name,
      newColumn?.name
    )
  }

  return result
}

export async function deleteLead(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('crm_leads_v2').delete().eq('id', id)
  if (error) {
    console.error('[CRM] Error deleting lead:', error)
    throw error
  }
}

export async function moveLead(id: string, columnId: string, position: number): Promise<void> {
  const supabase = await createClient()
  
  // Get old data
  const { data: oldLead } = await supabase
    .from('crm_leads_v2')
    .select('column_id, column:crm_columns!column_id(name)')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('crm_leads_v2')
    .update({ 
      column_id: columnId, 
      position, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)

  if (error) {
    console.error('[CRM] Error moving lead:', error)
    throw error
  }

  // Log if column changed
  if (oldLead && columnId !== oldLead.column_id) {
    const { data: newColumn } = await supabase
      .from('crm_columns')
      .select('name')
      .eq('id', columnId)
      .single()

    await logActivity(
      id, 
      'stage_changed', 
      `Movido de "${oldLead.column?.name}" para "${newColumn?.name}"`,
      oldLead.column?.name,
      newColumn?.name
    )
  }
}

export async function reorderLeads(columnId: string, leadIds: string[]): Promise<void> {
  const supabase = await createClient()
  
  const updates = leadIds.map((id, index) => 
    supabase
      .from('crm_leads_v2')
      .update({ position: index, column_id: columnId, updated_at: new Date().toISOString() })
      .eq('id', id)
  )

  await Promise.all(updates)
}

// =============================================
// LEAD TAGS
// =============================================

export async function addTagToLead(leadId: string, tagId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('crm_lead_tags')
    .insert({ lead_id: leadId, tag_id: tagId })

  if (error && !error.message.includes('duplicate')) {
    console.error('[CRM] Error adding tag to lead:', error)
    throw error
  }

  // Get tag name for history
  const { data: tag } = await supabase.from('crm_tags').select('name').eq('id', tagId).single()
  await logActivity(leadId, 'tag_added', `Tag "${tag?.name}" adicionada`)
}

export async function removeTagFromLead(leadId: string, tagId: string): Promise<void> {
  const supabase = await createClient()
  
  // Get tag name for history
  const { data: tag } = await supabase.from('crm_tags').select('name').eq('id', tagId).single()
  
  const { error } = await supabase
    .from('crm_lead_tags')
    .delete()
    .eq('lead_id', leadId)
    .eq('tag_id', tagId)

  if (error) {
    console.error('[CRM] Error removing tag from lead:', error)
    throw error
  }

  await logActivity(leadId, 'tag_removed', `Tag "${tag?.name}" removida`)
}

// =============================================
// CUSTOM VALUES
// =============================================

export async function setCustomValue(leadId: string, fieldId: string, value: string | null): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('crm_lead_custom_values')
    .upsert({ 
      lead_id: leadId, 
      field_id: fieldId, 
      value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'lead_id,field_id' })

  if (error) {
    console.error('[CRM] Error setting custom value:', error)
    throw error
  }
}

// =============================================
// ACTIVITY HISTORY
// =============================================

export async function getLeadHistory(leadId: string): Promise<CRMActivityHistory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('crm_activity_history')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[CRM] Error fetching lead history:', error)
    return []
  }
  return data || []
}

export async function logActivity(
  leadId: string, 
  action: string, 
  description?: string,
  oldValue?: string | null,
  newValue?: string | null,
  changedBy?: string | null
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('crm_activity_history')
    .insert({
      lead_id: leadId,
      action,
      description: description || null,
      old_value: oldValue || null,
      new_value: newValue || null,
      changed_by: changedBy || null,
    })

  if (error) {
    console.error('[CRM] Error logging activity:', error)
  }
}

export async function addNote(leadId: string, note: string): Promise<void> {
  await logActivity(leadId, 'note_added', note)
}
