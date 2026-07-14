import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteProduction } from '@/lib/data/productions'
import { deleteFromStorage } from '@/lib/storage'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    // Fetch all files linked to this production so we can remove them from MinIO
    const supabase = await createClient()
    const { data: files } = await supabase
      .from('production_files')
      .select('url')
      .eq('production_id', id)

    // Delete each file object from MinIO storage (best-effort, non-blocking on error)
    if (files && files.length > 0) {
      await Promise.all(
        files.map(async (file: { url: string }) => {
          try {
            if (file.url) await deleteFromStorage(file.url)
          } catch (error) {
            console.error('[v0] Error deleting file from MinIO:', error)
          }
        }),
      )
    }

    // Delete the production (cascades production_files rows in the database)
    await deleteProduction(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error deleting production:', error)
    return NextResponse.json({ error: 'Falha ao deletar produção' }, { status: 500 })
  }
}
