import { NextRequest, NextResponse } from "next/server"
import { getStorySchedules, createStorySchedule } from "@/lib/data/story-schedules"
import { sendStoryScheduleWebhook } from "@/lib/webhooks/story-schedule"
import type { CreateStoryScheduleInput, ScheduleConfigInput } from "@/lib/types/stories"

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId")
  if (!companyId) {
    return NextResponse.json({ error: "companyId é obrigatório" }, { status: 400 })
  }
  const schedules = await getStorySchedules(companyId)
  return NextResponse.json(schedules)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Agendamento em lote: aplica a mesma config a várias mídias
    if (Array.isArray(body.contentIds)) {
      const { company_id, contentIds, config } = body as {
        company_id: string
        contentIds: string[]
        config: ScheduleConfigInput
      }
      if (!company_id || contentIds.length === 0) {
        return NextResponse.json({ error: "company_id e contentIds são obrigatórios" }, { status: 400 })
      }
      const created = []
      for (const contentId of contentIds) {
        const schedule = await createStorySchedule({
          company_id,
          content_id: contentId,
          ...config,
        })
        if (schedule) {
          created.push(schedule)
          void sendStoryScheduleWebhook("schedule.created", schedule)
        }
      }
      return NextResponse.json(created, { status: 201 })
    }

    // Agendamento individual
    const input = body as CreateStoryScheduleInput
    if (!input.company_id || !input.content_id) {
      return NextResponse.json({ error: "company_id e content_id são obrigatórios" }, { status: 400 })
    }
    const schedule = await createStorySchedule(input)
    if (schedule) void sendStoryScheduleWebhook("schedule.created", schedule)
    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/stories/schedules:", error)
    return NextResponse.json({ error: "Falha ao criar agendamento" }, { status: 500 })
  }
}
