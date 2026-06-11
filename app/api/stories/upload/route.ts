import { put } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Upload de mídia (imagem/vídeo) para os Stories Automáticos.
// Retorna a URL do blob; o registro em story_contents é feito
// na sequência via POST /api/stories/contents.
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get("filename")

    if (!filename) {
      return NextResponse.json({ error: "filename é obrigatório" }, { status: 400 })
    }

    if (!req.body) {
      return NextResponse.json({ error: "arquivo ausente" }, { status: 400 })
    }

    const blob = await put(`stories/${Date.now()}-${filename}`, req.body, {
      access: "public",
      contentType: req.headers.get("content-type") || "application/octet-stream",
    })

    return NextResponse.json({ success: true, url: blob.url })
  } catch (error) {
    console.error("[v0] Error in /api/stories/upload:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
