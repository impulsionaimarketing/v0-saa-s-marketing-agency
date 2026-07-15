import { NextRequest, NextResponse } from "next/server"
import { renameStoryFolder, deleteStoryFolder } from "@/lib/data/story-folders"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await request.json()) as { name?: string }
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "name é obrigatório" }, { status: 400 })
    }
    const folder = await renameStoryFolder(id, body.name.trim())
    return NextResponse.json(folder)
  } catch (error) {
    console.error("[v0] Error in PATCH /api/stories/folders/[id]:", error)
    return NextResponse.json({ error: "Falha ao renomear pasta" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    // moveTo: pasta destino das mídias; vazio/null => mídias ficam "Sem pasta"
    const moveTo = request.nextUrl.searchParams.get("moveTo")
    await deleteStoryFolder(id, moveTo || null)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/stories/folders/[id]:", error)
    return NextResponse.json({ error: "Falha ao excluir pasta" }, { status: 500 })
  }
}
