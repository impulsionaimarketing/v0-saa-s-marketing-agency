import { NextRequest, NextResponse } from "next/server"
import {
  getStoryContents,
  createStoryContent,
  createStoryContentsBulk,
} from "@/lib/data/stories"
import type { CreateStoryContentInput } from "@/lib/types/stories"

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId")
  if (!companyId) {
    return NextResponse.json({ error: "companyId é obrigatório" }, { status: 400 })
  }
  const contents = await getStoryContents(companyId)
  return NextResponse.json(contents)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Importação em lote (Instagram)
    if (Array.isArray(body.items)) {
      const created = await createStoryContentsBulk(body.items as CreateStoryContentInput[])
      return NextResponse.json(created, { status: 201 })
    }

    if (!body.company_id) {
      return NextResponse.json({ error: "company_id é obrigatório" }, { status: 400 })
    }

    const content = await createStoryContent(body as CreateStoryContentInput)
    return NextResponse.json(content, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/stories/contents:", error)
    return NextResponse.json({ error: "Falha ao criar conteúdo" }, { status: 500 })
  }
}
