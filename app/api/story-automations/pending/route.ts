import { NextResponse, type NextRequest } from "next/server"
import { authorizeAutomationRequest } from "@/lib/api/automation-auth"
import { getPendingPublications } from "@/lib/data/story-automations"

/**
 * GET /api/story-automations/pending
 *
 * Consumido pelo n8n. Retorna a lista de conteúdos aptos a publicar agora
 * (automação ativa, instagram conectado, next_execution <= now(),
 * dentro do daily_limit). A seleção do conteúdo (aleatório/sequencial)
 * é resolvida no banco pela view vw_story_pending_publications.
 *
 * Header obrigatório: x-api-key: <STORY_AUTOMATION_API_KEY>
 */
export async function GET(request: NextRequest) {
  const unauthorized = authorizeAutomationRequest(request)
  if (unauthorized) return unauthorized

  try {
    const items = await getPendingPublications()
    return NextResponse.json(items)
  } catch (error) {
    console.error("[v0] /api/story-automations/pending error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar publicações pendentes." },
      { status: 500 },
    )
  }
}
