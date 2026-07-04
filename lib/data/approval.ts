'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Gerar link de aprovação para uma produção ───────────────────────────────
export async function generateApprovalLink(productionId: string): Promise<string> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('approval_links')
    .select('token')
    .eq('production_id', productionId)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing?.token) {
    return buildApprovalUrl(existing.token)
  }

  const { data, error } = await supabase
    .from('approval_links')
    .insert({ production_id: productionId })
    .select('token')
    .single()

  if (error || !data?.token) {
    throw new Error('Não foi possível gerar o link de aprovação.')
  }

  return buildApprovalUrl(data.token)
}

// ─── Regenerar link ───────────────────────────────────────────────────────────
export async function regenerateApprovalLink(productionId: string): Promise<string> {
  const supabase = await createClient()

  await supabase
    .from('approval_links')
    .delete()
    .eq('production_id', productionId)

  const { data, error } = await supabase
    .from('approval_links')
    .insert({ production_id: productionId })
    .select('token')
    .single()

  if (error || !data?.token) {
    throw new Error('Não foi possível regenerar o link.')
  }

  return buildApprovalUrl(data.token)
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
type PublicProductionFile = {
  url: string
  filename: string
  file_type: string
}

type PublicProduction = {
  id: string
  title: string
  client_name: string
  responsible_name: string
  post_date: string
  caption: string
  status: string
  video_url: string | null
  files: PublicProductionFile[]
}

// ─── Buscar produção pelo token ───────────────────────────────────────────────
export async function getProductionByToken(token: string): Promise<PublicProduction[] | null> {
  const { createClient } = await import('@supabase/supabase-js')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: link, error: linkError } = await supabase
    .from('approval_links')
    .select('production_id, production_ids')
    .eq('token', token)
    .maybeSingle()

  if (linkError || !link) return null

  const productionIds: string[] = []
  if (link.production_id) productionIds.push(link.production_id as string)
  if (Array.isArray(link.production_ids)) {
    for (const id of link.production_ids) {
      if (id && !productionIds.includes(id)) productionIds.push(id as string)
    }
  }

  if (productionIds.length === 0) return null

  const { data: productions, error: prodError } = await supabase
    .from('productions')
    .select(`
      id,
      title,
      caption,
      status,
      post_date,
      clients(name),
      production_files(id, filename, url, file_type, uploaded_at)
    `)
    .in('id', productionIds)

  if (prodError || !productions || productions.length === 0) return null

  return productions.map((p: any) => {
    const files: PublicProductionFile[] = Array.isArray(p.production_files)
      ? [...p.production_files]
          .sort((a, b) => {
  const pa = a.position ?? new Date(a.uploaded_at ?? 0).getTime()
  const pb = b.position ?? new Date(b.uploaded_at ?? 0).getTime()
  return pa - pb
})
          .map((f) => ({
            url: f.url,
            filename: f.filename,
            file_type: f.file_type,
          }))
      : []

    const previewFile = files[0]

    return {
      id: p.id,
      title: p.title || 'Conteúdo sem título',
      client_name: p.clients?.name || '',
      responsible_name: '',
      post_date: p.post_date || '',
      caption: p.caption || '',
      status: p.status || '',
      video_url: previewFile?.url || null,
      files,
    }
  })
}

// ─── Salvar resposta do cliente ───────────────────────────────────────────────
export async function submitApprovalResponse(params: {
  token: string
  productionId: string
  decision: 'aprovado' | 'reprovado'
  comment?: string
  clientName?: string
}): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error: approvalError } = await supabase
    .from('production_approvals')
    .insert({
      production_id: params.productionId,
      action: params.decision,
      comment: params.comment || null,
      approved_by: params.clientName || 'Cliente',
    })

  if (approvalError) throw new Error('Erro ao salvar aprovação.')

  if (params.comment?.trim()) {
    await supabase.from('production_comments').insert({
      production_id: params.productionId,
      author_name: params.clientName || 'Cliente',
      comment: params.comment.trim(),
      is_client: true,
    })
  }

  const newStatus = params.decision === 'aprovado' ? 'Aprovado' : 'Solicitou Ajuste'
  await supabase
    .from('productions')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', params.productionId)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildApprovalUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://dashboard.impulsionaimarketing.com.br')
  return `${base}/aprovacao/${token}`
}
