import { NextRequest, NextResponse } from "next/server"
import { updateStoryContent, deleteStoryContent } from "@/lib/data/stories"
import type { UpdateStoryContentInput } from "@/lib/types/stories"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await request.json()) as UpdateStoryContentInput
    const content = await updateStoryContent(id, body)
    return NextResponse.json(content)
  } catch (error) {
    console.error("[v0] Error in PATCH /api/stories/contents/[id]:", error)
    return NextResponse.json({ error: "Falha ao atualizar conteúdo" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await deleteStoryContent(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/stories/contents/[id]:", error)
    return NextResponse.json({ error: "Falha ao excluir conteúdo" }, { status: 500 })
  }
}
