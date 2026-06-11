import { NextRequest, NextResponse } from "next/server"
import { fetchInstagramPosts } from "@/lib/data/instagram"

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId")
  if (!companyId) {
    return NextResponse.json({ error: "companyId é obrigatório" }, { status: 400 })
  }
  const result = await fetchInstagramPosts(companyId)
  return NextResponse.json(result)
}
