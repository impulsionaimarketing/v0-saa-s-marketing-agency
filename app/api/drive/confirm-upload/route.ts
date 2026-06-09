import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { fileId, productionId, fileName, fileSize, mimeType } = await req.json()

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive'],
    })

    const drive = google.drive({ version: 'v3', auth })

    // Torna o arquivo público
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    const url = `https://drive.google.com/file/d/${fileId}/view`

    // Salva no Supabase
    const supabase = await createClient()
    await supabase.from('production_files').insert({
      production_id: productionId,
      filename: fileName,
      url,
      file_size: fileSize,
      file_type: mimeType,
      uploaded_by: 'dashboard',
    })

    return NextResponse.json({ success: true, url })
  } catch (error) {
    console.error('[drive/confirm-upload]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
