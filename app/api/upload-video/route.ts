import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToStorage } from '@/lib/storage'

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

    const contentType = req.headers.get('content-type') || 'application/octet-stream'
    const body = Buffer.from(await req.arrayBuffer())

    const { url } = await uploadToStorage(body, contentType, filename)

    const supabase = await createClient()
    await supabase.from('production_files').insert({
      production_id: productionId,
      filename: filename,
      url: url,
      file_size: Number(req.headers.get('content-length') || body.length),
      file_type: contentType,
      uploaded_by: 'dashboard',
    })

    return NextResponse.json({ success: true, url })
  } catch (error) {
    console.error('[upload] Erro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
