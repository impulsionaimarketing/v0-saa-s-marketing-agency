import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { productionIds } = await req.json()

    if (!productionIds || !Array.isArray(productionIds) || productionIds.length === 0) {
      return NextResponse.json({ error: 'productionIds obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('approval_links')
      .insert({ production_ids: productionIds })
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
