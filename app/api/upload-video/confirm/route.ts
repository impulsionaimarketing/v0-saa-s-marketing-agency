import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { productionId, url, filename, fileSize, fileType } = await req.json()

    if (!productionId || !url) {
      return NextResponse.json({ error: 'productionId e url são obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('production_files').insert({
      production_id: productionId,
      filename,
      url,
      file_size: fileSize,
      file_type: fileType,
      uploaded_by: 'dashboard',
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
