'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Gerar link de aprovação para uma produção ───────────────────────────────
export async function generateApprovalLink(productionId: string): Promise<string> {
  const supabase = await createClient()

  // Verifica se já existe um link ativo
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

  // Cria novo token
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

// ─── Regenerar link (invalida o anterior criando um novo) ────────────────────
export async function regenerateApprovalLink(productionId: string): Promise<string> {
  const supabase = await createClient()

  // Deleta links anteriores
  await supabase
    .from('approval_links')
    .delete()
    .eq('production_id', productionId)

  // Cria novo
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

// ─── Buscar produção pelo token (página pública do cliente) ──────────────────
export async function getProductionByToken(token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('get_production_by_token', { p_token: token })

  if (error || !data || data.length === 0) return null

  return data[0] as {
    id: string
    title: string
    client_name: string
    responsible_name: string
    post_date: string
    caption: string
    status: string
    video_url: string | null
  }
}

// ─── Salvar resposta do cliente ───────────────────────────────────────────────
export async function submitApprovalResponse(params: {
  token: string
  productionId: string
  decision: 'aprovado' | 'reprovado'
  comment?: string
  clientName?: string
}): Promise<void> {
  const supabase = await createClient()

  // Salva na tabela de aprovações
  const { error: approvalError } = await supabase
    .from('production_approvals')
    .insert({
      production_id: params.productionId,
      action: params.decision,
      comment: params.comment || null,
      approved_by: params.clientName || 'Cliente',
    })

  if (approvalError) throw new Error('Erro ao salvar aprovação.')

  // Salva o comentário se houver
  if (params.comment?.trim()) {
    await supabase.from('production_comments').insert({
      production_id: params.productionId,
      author_name: params.clientName || 'Cliente',
      comment: params.comment.trim(),
      is_client: true,
    })
  }

  // Atualiza o status da produção
  const newStatus = params.decision === 'aprovado' ? 'Aprovado' : 'Solicitou Ajuste'
  await supabase
    .from('productions')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', params.productionId)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildApprovalUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://dashboard.impulsionaimarketing.com.br')
  return `${base}/aprovacao/${token}`
}
