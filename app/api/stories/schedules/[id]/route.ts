import { NextRequest, NextResponse } from "next/server"
import {
  updateStorySchedule,
  setStoryScheduleStatus,
  duplicateStorySchedule,
  deleteStorySchedule,
} from "@/lib/data/story-schedules"
import { sendStoryScheduleWebhook } from "@/lib/webhooks/story-schedule"
import type { ScheduleConfigInput } from "@/lib/types/stories"

// PATCH: edita a configuração do agendamento
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const config = (await request.json()) as ScheduleConfigInput
    const schedule = await updateStorySchedule(id, config)
    if (schedule) void sendStoryScheduleWebhook("schedule.updated", schedule)
    return NextResponse.json(schedule)
  } catch (error) {
    console.error("[v0] Error in PATCH /api/stories/schedules/[id]:", error)
    return NextResponse.json({ error: "Falha ao atualizar agendamento" }, { status: 500 })
  }
}

// POST: ações (pausar / retomar / duplicar)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { action } = (await request.json()) as { action: "pause" | "resume" | "duplicate" }

    if (action === "pause") {
      const schedule = await setStoryScheduleStatus(id, "paused")
      if (schedule) void sendStoryScheduleWebhook("schedule.paused", schedule)
      return NextResponse.json(schedule)
    }
    if (action === "resume") {
      const schedule = await setStoryScheduleStatus(id, "scheduled")
      if (schedule) void sendStoryScheduleWebhook("schedule.resumed", schedule)
      return NextResponse.json(schedule)
    }
    if (action === "duplicate") {
      const schedule = await duplicateStorySchedule(id)
      if (schedule) void sendStoryScheduleWebhook("schedule.created", schedule)
      return NextResponse.json(schedule, { status: 201 })
    }
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Error in POST /api/stories/schedules/[id]:", error)
    return NextResponse.json({ error: "Falha na ação do agendamento" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await deleteStorySchedule(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/stories/schedules/[id]:", error)
    return NextResponse.json({ error: "Falha ao excluir agendamento" }, { status: 500 })
  }
}
