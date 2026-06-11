import { NextResponse } from "next/server"
import { getAutomationHealth } from "@/lib/data/story-automations"

/**
 * GET /api/stories/health
 * Métricas globais de saúde da automação para o dashboard (UI autenticada).
 */
export async function GET() {
  try {
    const health = await getAutomationHealth()
    return NextResponse.json(health)
  } catch (error) {
    console.error("[v0] /api/stories/health error:", error)
    return NextResponse.json(
      { active_automations: 0, published_today: 0, failed_today: 0, upcoming_24h: 0 },
      { status: 200 },
    )
  }
}
