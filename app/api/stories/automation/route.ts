import { NextRequest, NextResponse } from "next/server"
import {
  getStoryAutomation,
  listStoryAutomations,
  upsertStoryAutomation,
  deleteStoryAutomation,
} from "@/lib/data/stories"
import type { UpsertStoryAutomationInput } from "@/lib/types/stories"

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId")
  const folderId = request.nextUrl.searchParams.get("folderId")
  if (!companyId) {
    return NextResponse.json({ error: "companyId é obrigatório" }, { status: 400 })
  }
  // Com folderId => automação daquela pasta; sem => lista de todas as automações.
  if (folderId) {
    const automation = await getStoryAutomation(companyId, folderId)
    return NextResponse.json(automation)
  }
  const automations = await listStoryAutomations(companyId)
  return NextResponse.json(automations)
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as UpsertStoryAutomationInput
    if (!body.company_id) {
      return NextResponse.json({ error: "company_id é obrigatório" }, { status: 400 })
    }
    if (!body.folder_id) {
      return NextResponse.json({ error: "folder_id é obrigatório" }, { status: 400 })
    }
    const automation = await upsertStoryAutomation(body)
    return NextResponse.json(automation)
  } catch (error) {
    console.error("[v0] Error in PUT /api/stories/automation:", error)
    return NextResponse.json({ error: "Falha ao salvar automação" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const companyId = request.nextUrl.searchParams.get("companyId")
    const folderId = request.nextUrl.searchParams.get("folderId")
    if (!companyId || !folderId) {
      return NextResponse.json(
        { error: "companyId e folderId são obrigatórios" },
        { status: 400 },
      )
    }
    await deleteStoryAutomation(companyId, folderId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/stories/automation:", error)
    return NextResponse.json({ error: "Falha ao remover automação" }, { status: 500 })
  }
}
