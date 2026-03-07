import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch demands with area 'Arte' or 'Vídeo'
    const { data, error } = await supabase
      .from('demands')
      .select(`
        id, 
        name, 
        area, 
        status, 
        deadline, 
        client_id, 
        priority, 
        created_at, 
        description,
        clients(name),
        users(name)
      `)
      .in('area', ['Arte', 'Vídeo'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data to include client_name and responsible_name
    const transformedData = (data || []).map((demand: any) => ({
      ...demand,
      client_name: demand.clients?.name || 'Cliente',
      responsible_name: demand.users?.name || 'Não atribuído'
    }))

    console.log('[v0] Demands fetched:', transformedData.length)
    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('[v0] Demands by area API error:', error)
    return NextResponse.json({ error: 'Erro ao buscar demandas' }, { status: 500 })
  }
}
