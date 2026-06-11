import { NextRequest, NextResponse } from "next/server"
import { getStorySummary } from "@/lib/data/stories"

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId")
  if (!companyId) {
    return NextResponse.json({ error: "companyId é obrigatório" }, { status: 400 })
  }
  const summary = await getStorySummary(companyId)
  return NextResponse.json(summary)
}
