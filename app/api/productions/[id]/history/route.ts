import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productionId } = await params
    const supabase = await createClient()

    const { data: history, error } = await supabase
      .from('production_status_history')
      .select('*')
      .eq('production_id', productionId)
      .order('changed_at', { ascending: false })

    if (error) {
      console.error('Error fetching history:', error)
      return NextResponse.json({ error: 'Falha ao carregar histórico' }, { status: 500 })
    }

    return NextResponse.json(history || [])
  } catch (error: any) {
    console.error('Error in history fetch:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
