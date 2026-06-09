import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('filename')
    const productionId = searchParams.get('productionId')

    if (!filename || !productionId) {
      return NextResponse.json({ error: 'filename e productionId são obrigatórios' }, { status: 400 })
    }

    const blob = await put(filename, req.body!, {
      access: 'public',
      contentType: req.headers.get('content-type') || 'application/octet-stream',
    })

    const supabase = await createClient()
    await supabase.from('production_files').insert({
      production_id: productionId,
      filename: filename,
      url: blob.url,
      file_size: Number(req.headers.get('content-length') || 0),
      file_type: req.headers.get('content-type') || '',
      uploaded_by: 'dashboard',
    })

    return NextResponse.json({ success: true, url: blob.url })
  } catch (error) {
    console.error('[upload] Erro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
