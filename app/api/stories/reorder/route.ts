import { NextRequest, NextResponse } from "next/server"
import { reorderStoryContents } from "@/lib/data/stories"
import type { ReorderStoryContentInput } from "@/lib/types/stories"

// POST: reordena os conteúdos (modo Sequencial).
// Body: [{ id: string, position: number }, ...]
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: "Body deve ser um array com pelo menos um item." },
        { status: 400 },
      )
    }

    // Valida cada item do array
    const items: ReorderStoryContentInput[] = []
    for (const raw of body) {
      const id = (raw as any)?.id
      const position = (raw as any)?.position
      if (typeof id !== "string" || id.length === 0 || typeof position !== "number") {
        return NextResponse.json(
          { error: "Cada item deve conter { id: string, position: number }." },
          { status: 400 },
        )
      }
      items.push({ id, position })
    }

    await reorderStoryContents(items)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in POST /api/stories/reorder:", error)
    return NextResponse.json({ error: "Falha ao reordenar conteúdos" }, { status: 500 })
  }
}
