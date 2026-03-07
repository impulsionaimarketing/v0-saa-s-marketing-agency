import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const clientName = decodeURIComponent(id)
    
    console.log('[v0] API: Route called with id:', id)
    console.log('[v0] API: Decoded client name:', clientName)
    
    const supabase = await createClient()
    console.log('[v0] API: Supabase client created')
    
    // Try exact match first
    let { data, error } = await supabase
      .from('clients')
      .select('*')
      .ilike('name', clientName)
      .single()

    console.log('[v0] API: First query - error:', error?.message, 'data:', data?.name)

    // If not found with exact match, try partial match
    if (error) {
      console.log('[v0] API: Exact match not found, trying partial match...')
      const { data: partialData, error: partialError } = await supabase
        .from('clients')
        .select('*')
        .ilike('name', `%${clientName}%`)
        .limit(1)

      console.log('[v0] API: Partial query - error:', partialError?.message, 'data:', partialData?.[0]?.name)

      if (!partialError && partialData && partialData.length > 0) {
        data = partialData[0]
        error = null
      } else {
        error = partialError
      }
    }

    if (error || !data) {
      console.error('[v0] API: Client not found:', clientName, error?.message)
      return NextResponse.json({ 
        error: 'Cliente não encontrado',
        searchedName: clientName
      }, { status: 404 })
    }

    console.log('[v0] API: Client found:', data.name)
    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Erro ao buscar cliente', details: String(error) }, { status: 500 })
  }
}
