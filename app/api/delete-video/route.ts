// Delete video API route
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteFromStorage } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    const { fileId, url } = await request.json()

    if (!url || !fileId) {
      return NextResponse.json({ error: 'URL e ID não fornecidos' }, { status: 400 })
    }

    // Remove o registro do banco usando o client de servidor do Supabase.
    const supabase = await createClient()
    const { error } = await supabase.from('production_files').delete().eq('id', fileId)

    if (error) {
      console.error('[v0] Delete DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Remove o arquivo do MinIO (não bloqueia a resposta se falhar).
    try {
      await deleteFromStorage(url)
    } catch (storageError) {
      console.error('[v0] Delete storage error (ignorado):', storageError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Delete error:', error)
    return NextResponse.json({ error: 'Falha ao deletar' }, { status: 500 })
  }
}
