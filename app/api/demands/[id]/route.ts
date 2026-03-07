import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()

    console.log('[v0] Updating demand:', id, 'status:', status)

    const { data, error } = await supabase
      .from('demands')
      .update({ status })
      .eq('id', id)
      .select()

    if (error) {
      console.error('[v0] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.error('[v0] Demand not found:', id)
      return NextResponse.json({ error: 'Demanda não encontrada' }, { status: 404 })
    }

    console.log('[v0] Demand updated:', data)
    return NextResponse.json(data[0])
  } catch (error) {
    console.error('[v0] Demand update API error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar demanda' }, { status: 500 })
  }
}
