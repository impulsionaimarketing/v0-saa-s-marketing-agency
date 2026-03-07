import { createClient } from '@/lib/supabase/client'
import { sendWebhookNotification } from '@/lib/webhooks/send-notification'

// Production files management - FIXED VERSION
export interface ProductionFile {
  id: string
  production_id: string
  file_url: string
  file_type: 'video' | 'image' | 'document'
  file_name: string
  file_size: number
  uploaded_by: string
  created_at: string
}

export async function getProductionFiles(productionId: string): Promise<ProductionFile[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('production_files')
    .select('*')
    .eq('production_id', productionId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching production files:', error)
    return []
  }

  return data || []
}

export async function createProductionFile(file: Omit<ProductionFile, 'id' | 'created_at'>): Promise<ProductionFile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('production_files')
    .insert([file])
    .select()
    .single()

  if (error) {
    console.error('[v0] Error creating production file:', error)
    return null
  }

  // Send webhook notification
  await sendWebhookNotification({
    event: 'production_file.created',
    data: {
      file_id: data.id,
      production_id: data.production_id,
      file_type: data.file_type,
      file_name: data.file_name,
    },
  })

  return data
}

export async function deleteProductionFile(fileId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('production_files')
    .delete()
    .eq('id', fileId)

  if (error) {
    console.error('[v0] Error deleting production file:', error)
    return false
  }

  // Send webhook notification
  await sendWebhookNotification({
    event: 'production_file.deleted',
    data: {
      file_id: fileId,
    },
  })

  return true
}

export async function updateProductionFile(fileId: string, updates: Partial<ProductionFile>): Promise<ProductionFile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('production_files')
    .update(updates)
    .eq('id', fileId)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error updating production file:', error)
    return null
  }

  return data
}
