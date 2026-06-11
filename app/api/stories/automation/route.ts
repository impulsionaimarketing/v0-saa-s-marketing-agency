import { NextRequest, NextResponse } from "next/server"
import { getStoryAutomation, upsertStoryAutomation } from "@/lib/data/stories"
import type { UpsertStoryAutomationInput } from "@/lib/types/stories"

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId")
  if (!companyId) {
    return NextResponse.json({ error: "companyId é obrigatório" }, { status: 400 })
  }
  const automation = await getStoryAutomation(companyId)
  return NextResponse.json(automation)
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as UpsertStoryAutomationInput
    if (!body.company_id) {
      return NextResponse.json({ error: "company_id é obrigatório" }, { status: 400 })
    }
    const automation = await upsertStoryAutomation(body)
    return NextResponse.json(automation)
  } catch (error) {
    console.error("[v0] Error in PUT /api/stories/automation:", error)
    return NextResponse.json({ error: "Falha ao salvar automação" }, { status: 500 })
  }
}
