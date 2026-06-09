import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateClientFolder, uploadFileToDrive } from '@/lib/google-drive'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const productionId = formData.get('productionId') as string | null

    if (!file || !productionId) {
      return NextResponse.json({ error: 'Arquivo e productionId são obrigatórios' }, { status: 400 })
    }

    // Busca o nome do cliente para criar/usar a pasta correta
    const supabase = await createClient()
    const { data: production } = await supabase
      .from('productions')
      .select('client_id, clients(name)')
      .eq('id', productionId)
      .single()

    const clientName = (production?.clients as any)?.name || 'Cliente'

    // Converte o arquivo para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Pega ou cria a pasta do cliente no Drive
    const folderId = await getOrCreateClientFolder(clientName)

    // Faz o upload para o Drive
    const { id: driveFileId, url } = await uploadFileToDrive({
      fileName: file.name,
      mimeType: file.type,
      buffer,
      folderId,
    })

    // Salva referência no Supabase
    const { error: dbError } = await supabase
      .from('production_files')
      .insert({
        production_id: productionId,
        filename: file.name,
        url,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: 'dashboard',
      })

    if (dbError) {
      console.error('[upload] Erro ao salvar no Supabase:', dbError)
    }

    return NextResponse.json({ success: true, url, driveFileId })
  } catch (error) {
    console.error('[upload] Erro:', error)
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
  }
}
