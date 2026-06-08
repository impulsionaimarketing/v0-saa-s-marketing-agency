import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { productionId, regenerate } = await req.json()

    if (!productionId) {
      return NextResponse.json({ error: 'productionId obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()

    if (regenerate) {
      await supabase.from('approval_links').delete().eq('production_id', productionId)
    } else {
      // Verifica se já existe link ativo
      const { data: existing } = await supabase
        .from('approval_links')
        .select('token')
        .eq('production_id', productionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existing?.token) {
        const base = process.env.NEXT_PUBLIC_APP_URL || 'https://dashboard.impulsionaimarketing.com.br'
        return NextResponse.json({ url: `${base}/aprovacao/${existing.token}` })
      }
    }

    const { data, error } = await supabase
      .from('approval_links')
      .insert({ production_id: productionId })
      .select('token')
      .single()

    if (error || !data?.token) {
      return NextResponse.json({ error: 'Erro ao gerar token' }, { status: 500 })
    }

    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://dashboard.impulsionaimarketing.com.br'
    return NextResponse.json({ url: `${base}/aprovacao/${data.token}` })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
