"use server"

import type { StorySchedule } from "@/lib/types/stories"

export type StoryScheduleEvent = "schedule.created" | "schedule.updated" | "schedule.paused" | "schedule.resumed" | "schedule.deleted"

interface StoryWebhookPayload {
  event: StoryScheduleEvent
  timestamp: string
  schedule: {
    id: string
    company_id: string
    company_name?: string | null
    content_id: string
    content_url?: string | null
    content_type?: string | null
    frequency_type: string
    interval_days: number
    weekdays: number[]
    execution_time: string
    start_date: string
    end_date: string | null
    total_weeks: number | null
    execution_mode: string
    next_execution: string | null
    status: string
    enabled: boolean
  }
}

// Dispara um webhook para o n8n com as datas já calculadas.
// Fire-and-forget: falhas não quebram a operação principal.
export async function sendStoryScheduleWebhook(
  event: StoryScheduleEvent,
  schedule: StorySchedule,
) {
  const webhookUrl =
    process.env.NEXT_PUBLIC_N8N_STORY_WEBHOOK_URL || process.env.WEBHOOK_URL

  if (!webhookUrl) {
    console.log("[v0] Story webhook URL não configurada, ignorando notificação")
    return
  }

  const payload: StoryWebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    schedule: {
      id: schedule.id,
      company_id: schedule.company_id,
      company_name: schedule.company_name ?? null,
      content_id: schedule.content_id,
      content_url: schedule.content_file_url ?? null,
      content_type: schedule.content_type ?? null,
      frequency_type: schedule.frequency_type,
      interval_days: schedule.interval_days,
      weekdays: schedule.weekdays,
      execution_time: schedule.execution_time,
      start_date: schedule.start_date,
      end_date: schedule.end_date,
      total_weeks: schedule.total_weeks,
      execution_mode: schedule.execution_mode,
      next_execution: schedule.next_execution,
      status: schedule.status,
      enabled: schedule.enabled,
    },
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.WEBHOOK_SECRET || "",
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      console.error("[v0] Story webhook falhou:", response.status, response.statusText)
    } else {
      console.log("[v0] Story webhook enviado:", event, schedule.id)
    }
  } catch (error) {
    console.error("[v0] Erro ao enviar story webhook:", error)
  }
}
