import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const productionId = formData.get('productionId') as string | null

    if (!file || !productionId) {
      return NextResponse.json({ error: 'Arquivo e productionId são obrigatórios' }, { status: 400 })
    }

    // Faz upload para o Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    })

    // Salva referência no Supabase
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from('production_files')
      .insert({
        production_id: productionId,
        filename: file.name,
        url: blob.url,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: 'dashboard',
      })

    if (dbError) {
      console.error('[upload] Erro ao salvar no Supabase:', dbError)
    }

    return NextResponse.json({ success: true, url: blob.url })
  } catch (error) {
    console.error('[upload] Erro:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
