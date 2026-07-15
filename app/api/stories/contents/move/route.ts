import { NextRequest, NextResponse } from "next/server"
import { moveStoryContents, deleteStoryContents } from "@/lib/data/stories"

// POST: move várias mídias para uma pasta (folderId null => "Sem pasta")
export async function POST(request: NextRequest) {
  try {
    const { ids, folderId } = (await request.json()) as {
      ids: string[]
      folderId: string | null
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids é obrigatório" }, { status: 400 })
    }
    await moveStoryContents(ids, folderId ?? null)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in POST /api/stories/contents/move:", error)
    return NextResponse.json({ error: "Falha ao mover conteúdos" }, { status: 500 })
  }
}

// DELETE: exclui várias mídias de uma vez
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = (await request.json()) as { ids: string[] }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids é obrigatório" }, { status: 400 })
    }
    await deleteStoryContents(ids)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/stories/contents/move:", error)
    return NextResponse.json({ error: "Falha ao excluir conteúdos" }, { status: 500 })
  }
}
