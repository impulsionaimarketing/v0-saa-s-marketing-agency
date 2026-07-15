import type { ScheduleConfigInput } from "@/lib/types/stories"

// Utilitários puros de cálculo de datas de agendamento.
// Mantidos fora de arquivos "use server" para poderem ser síncronos
// e reutilizados no cliente (preview do modal) e no servidor.

function parseTimeParts(time: string): { h: number; m: number } {
  const [h, m] = (time || "08:00").split(":").map((v) => Number.parseInt(v, 10))
  return { h: Number.isFinite(h) ? h : 8, m: Number.isFinite(m) ? m : 0 }
}

// Cria um Date a partir de "YYYY-MM-DD" (data local, meia-noite)
function parseDate(dateStr: string): Date {
  const [y, mo, d] = dateStr.split("-").map((v) => Number.parseInt(v, 10))
  return new Date(y, (mo || 1) - 1, d || 1, 0, 0, 0, 0)
}

function atTime(date: Date, time: string): Date {
  const { h, m } = parseTimeParts(time)
  const result = new Date(date)
  result.setHours(h, m, 0, 0)
  return result
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Calcula a data/hora da próxima publicação com base na configuração.
// Retorna ISO string ou null (ex.: weekdays sem dias marcados).
export function computeNextExecution(
  config: ScheduleConfigInput,
  from: Date = new Date(),
): string | null {
  const start = parseDate(config.start_date)
  // Ponto de partida: nunca antes da data inicial
  const floor = start.getTime() > from.getTime() ? start : from

  if (config.frequency_type === "daily") {
    let candidate = atTime(floor, config.execution_time)
    if (candidate.getTime() <= from.getTime()) {
      candidate = atTime(addDays(floor, 1), config.execution_time)
    }
    return candidate.toISOString()
  }

  if (config.frequency_type === "interval") {
    const step = Math.max(config.interval_days ?? 1, 1)
    // Percorre a partir de start_date em passos de `step` dias
    let candidate = atTime(start, config.execution_time)
    let guard = 0
    while (candidate.getTime() <= from.getTime() && guard < 3660) {
      candidate = atTime(addDays(candidate, step), config.execution_time)
      guard++
    }
    return candidate.toISOString()
  }

  if (config.frequency_type === "weekdays") {
    const weekdays = config.weekdays ?? []
    if (weekdays.length === 0) return null
    // Procura nos próximos 14 dias a partir do floor
    for (let i = 0; i < 14; i++) {
      const day = addDays(floor, i)
      const candidate = atTime(day, config.execution_time)
      if (weekdays.includes(candidate.getDay()) && candidate.getTime() > from.getTime()) {
        return candidate.toISOString()
      }
    }
    return null
  }

  return null
}

// Calcula a data final (YYYY-MM-DD) a partir da data inicial + nº de semanas.
export function computeEndDate(startDate: string, totalWeeks?: number | null): string | null {
  if (!totalWeeks || totalWeeks <= 0) return null
  const end = addDays(parseDate(startDate), totalWeeks * 7)
  const y = end.getFullYear()
  const m = String(end.getMonth() + 1).padStart(2, "0")
  const d = String(end.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
