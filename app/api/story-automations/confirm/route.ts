import { NextResponse, type NextRequest } from "next/server"
import { authorizeAutomationRequest } from "@/lib/api/automation-auth"
import { confirmPublication } from "@/lib/data/story-automations"
import type { StoryConfirmPayload } from "@/lib/types/stories"

/**
 * POST /api/story-automations/confirm
 *
 * Consumido pelo n8n após executar (ou falhar) uma publicação.
 * Atualiza histórico, próxima execução e estado da sequência de forma
 * atômica via função SQL story_confirm_publication.
 *
 * Header obrigatório: x-api-key: <STORY_AUTOMATION_API_KEY>
 * Body:
 *  {
 *    "automation_id": "...",
 *    "content_id": "...",
 *    "status": "success" | "failed",
 *    "instagram_story_id": "...",   // opcional
 *    "error_message": "..."         // opcional (em caso de falha)
 *  }
 */
export async function POST(request: NextRequest) {
  const unauthorized = authorizeAutomationRequest(request)
  if (unauthorized) return unauthorized

  try {
    const body = (await request.json()) as Partial<StoryConfirmPayload>

    if (!body.automation_id || !body.content_id || !body.status) {
      return NextResponse.json(
        { error: "Campos obrigatórios: automation_id, content_id, status." },
        { status: 400 },
      )
    }

    if (body.status !== "success" && body.status !== "failed") {
      return NextResponse.json(
        { error: "status deve ser 'success' ou 'failed'." },
        { status: 400 },
      )
    }

    const result = await confirmPublication({
      automation_id: body.automation_id,
      content_id: body.content_id,
      status: body.status,
      instagram_story_id: body.instagram_story_id,
      error_message: body.error_message,
    })

    return NextResponse.json({ success: true, history: result })
  } catch (error) {
    console.error("[v0] /api/story-automations/confirm error:", error)
    return NextResponse.json(
      { error: "Erro ao confirmar publicação." },
      { status: 500 },
    )
  }
}
