import { NextRequest, NextResponse } from "next/server"
import { getStoryFolders, createStoryFolder } from "@/lib/data/story-folders"
import type { CreateStoryFolderInput } from "@/lib/types/stories"

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId")
  if (!companyId) {
    return NextResponse.json({ error: "companyId é obrigatório" }, { status: 400 })
  }
  const folders = await getStoryFolders(companyId)
  return NextResponse.json(folders)
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateStoryFolderInput
    if (!body.company_id || !body.name?.trim()) {
      return NextResponse.json({ error: "company_id e name são obrigatórios" }, { status: 400 })
    }
    const folder = await createStoryFolder({ ...body, name: body.name.trim() })
    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/stories/folders:", error)
    return NextResponse.json({ error: "Falha ao criar pasta" }, { status: 500 })
  }
}
