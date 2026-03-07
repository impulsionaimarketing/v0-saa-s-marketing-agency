// Upload video API route - v2024
import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createProductionFile } from '@/lib/data/production-files'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const productionId = formData.get('productionId') as string

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 })
    }

    if (!productionId) {
      return NextResponse.json({ error: 'ID de produção não fornecido' }, { status: 400 })
    }

    // Validate file type (images and videos)
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Apenas imagens e vídeos são permitidos' }, { status: 400 })
    }

    // Upload to Vercel Blob with organized path
    // Use multipart for files larger than 5MB for better performance
    const filename = `productions/${productionId}/${Date.now()}-${file.name}`
    const blob = await put(filename, file, {
      access: 'public',
      multipart: file.size > 5 * 1024 * 1024, // Use multipart for files > 5MB
    })

    // Save reference to database
    const productionFile = await createProductionFile({
      production_id: productionId,
      filename: file.name,
      url: blob.url,
      file_size: file.size,
      file_type: file.type,
    })

    return NextResponse.json({
      id: productionFile?.id,
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: productionFile?.uploaded_at || new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json({ error: 'Falha no upload' }, { status: 500 })
  }
}
