import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { fileIds } = await req.json()

    if (!fileIds || !Array.isArray(fileIds)) {
      return NextResponse.json({ error: 'fileIds obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()

    await Promise.all(
      fileIds.map((fileId: string, index: number) =>
        supabase
          .from('production_files')
          .update({ position: index })
          .eq('id', fileId)
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
