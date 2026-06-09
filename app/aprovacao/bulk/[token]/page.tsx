import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BulkApprovalClient } from './bulk-approval-client'

export default async function BulkApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Busca o token e os production_ids
  const { data: link } = await supabase
    .from('approval_links')
    .select('token, production_ids')
    .eq('token', token)
    .single()

  if (!link?.production_ids || link.production_ids.length === 0) {
    notFound()
  }

  // Busca todas as produções
  const { data: productions } = await supabase
    .from('productions')
    .select(`
      id,
      title,
      caption,
      status,
      type,
      post_date,
      clients(name),
      production_files(id, filename, url, file_type)
    `)
    .in('id', link.production_ids)

  if (!productions || productions.length === 0) {
    notFound()
  }

  const formatted = productions.map((p: any) => ({
    id: p.id,
    title: p.title || 'Sem título',
    caption: p.caption || '',
    status: p.status,
    type: p.type,
    post_date: p.post_date,
    client_name: p.clients?.name || '',
    files: p.production_files || [],
  }))

  return <BulkApprovalClient productions={formatted} token={token} />
}
