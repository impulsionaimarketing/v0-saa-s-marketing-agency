// Delete video API route - v2024
import { type NextRequest, NextResponse } from 'next/server'
import { deleteProductionFile } from '@/lib/data/production-files'
import { deleteFromStorage } from '@/lib/storage'

export async function DELETE(request: NextRequest) {
  try {
    const { fileId, url } = await request.json()

    if (!url || !fileId) {
      return NextResponse.json({ error: 'URL e ID não fornecidos' }, { status: 400 })
    }

    // Delete from database first
    await deleteProductionFile(fileId)

    // Delete from MinIO storage
    await deleteFromStorage(url)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Delete error:', error)
    return NextResponse.json({ error: 'Falha ao deletar' }, { status: 500 })
  }
}
