import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientName = searchParams.get('name') || ''
    
    const supabase = await createClient()
    
    // If no search term, return all clients
    if (!clientName.trim()) {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 })
      }

      return NextResponse.json(data || [])
    }

    // Try exact match first
    let { data, error } = await supabase
      .from('clients')
      .select('*')
      .ilike('name', clientName)
      .single()

    // If not found, try partial match
    if (error) {
      const { data: partialData } = await supabase
        .from('clients')
        .select('*')
        .ilike('name', `%${clientName}%`)
        .limit(1)

      if (partialData && partialData.length > 0) {
        data = partialData[0]
        error = null
      }
    }

    if (!data) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Search API error:', error)
    return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 })
  }
}
