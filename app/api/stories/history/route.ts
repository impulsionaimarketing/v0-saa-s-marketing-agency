import { NextRequest, NextResponse } from "next/server"
import { getStoryHistory } from "@/lib/data/stories"

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId")
  if (!companyId) {
    return NextResponse.json({ error: "companyId é obrigatório" }, { status: 400 })
  }
  const history = await getStoryHistory(companyId)
  return NextResponse.json(history)
}
