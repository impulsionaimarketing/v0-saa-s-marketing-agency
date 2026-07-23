// Tipagens da funcionalidade "Stories Automáticos"
// Preparado para integração futura com Supabase, n8n e Instagram Graph API.

export type StoryContentType = "image" | "video"
export type StoryContentSource = "upload" | "instagram"
export type StoryPublishMode = "random" | "sequential"
export type StoryFrequencyType = "daily" | "interval" | "weekdays"
export type StoryPublicationStatus = "scheduled" | "published" | "failed"

export interface StoryContent {
  id: string
  company_id: string
  type: StoryContentType
  source: StoryContentSource
  file_url: string | null
  thumbnail_url: string | null
  caption: string | null
  name: string | null
  folder_id: string | null
  instagram_media_id: string | null
  instagram_permalink: string | null
  is_active: boolean
  // Ordem de publicação (modo Sequencial). Ordenar sempre por position ASC.
  position: number
  created_by: string | null
  created_at: string
  updated_at: string
  // dados agregados via join (somente leitura)
  folder_name?: string | null
  schedule?: StorySchedule | null
}

// Item usado para reordenar a lista de conteúdos (drag & drop)
export interface ReorderStoryContentInput {
  id: string
  position: number
}

// =====================================================================
// PASTAS (organização estilo Google Drive)
// =====================================================================

export interface StoryFolder {
  id: string
  company_id: string
  name: string
  created_by: string | null
  created_at: string
  updated_at: string
  // agregado via join (somente leitura)
  content_count?: number
}

export interface CreateStoryFolderInput {
  company_id: string
  name: string
  created_by?: string | null
}

// =====================================================================
// AGENDAMENTO POR MÍDIA
// =====================================================================

export type ScheduleFrequencyType = "daily" | "interval" | "weekdays"
export type ScheduleExecutionMode = "sequential" | "random"
export type ScheduleStatus = "scheduled" | "paused" | "published" | "failed"

export interface StorySchedule {
  id: string
  company_id: string
  content_id: string
  frequency_type: ScheduleFrequencyType
  interval_days: number
  weekdays: number[]
  execution_time: string
  start_date: string
  end_date: string | null
  total_weeks: number | null
  execution_mode: ScheduleExecutionMode
  next_execution: string | null
  last_execution: string | null
  status: ScheduleStatus
  enabled: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  // dados agregados via join (somente leitura)
  content_type?: StoryContentType
  content_thumbnail_url?: string | null
  content_file_url?: string | null
  content_name?: string | null
  folder_id?: string | null
  folder_name?: string | null
  company_name?: string | null
}

// Configuração aplicada a uma ou várias mídias
export interface ScheduleConfigInput {
  frequency_type: ScheduleFrequencyType
  interval_days?: number
  weekdays?: number[]
  execution_time: string
  start_date: string
  total_weeks?: number | null
  end_date?: string | null
  execution_mode: ScheduleExecutionMode
}

export interface CreateStoryScheduleInput extends ScheduleConfigInput {
  company_id: string
  content_id: string
  created_by?: string | null
}

export interface StoryAutomation {
  id: string
  company_id: string
  folder_id: string | null
  instagram_account_id: string | null
  enabled: boolean
  publish_mode: StoryPublishMode
  frequency_type: StoryFrequencyType
  frequency_value: number
  weekdays: number[]
  execution_time: string
  daily_limit: number
  last_execution: string | null
  next_execution: string | null
  last_content_id: string | null
  created_at: string
  updated_at: string
  // agregado via join (somente leitura)
  folder_name?: string | null
}

export interface StoryPublicationHistory {
  id: string
  automation_id: string | null
  company_id: string | null
  content_id: string | null
  scheduled_for: string | null
  published_at: string | null
  status: StoryPublicationStatus
  instagram_story_id: string | null
  error_message: string | null
  created_at: string
  // dados agregados via join (somente leitura)
  content_type?: StoryContentType
  content_source?: StoryContentSource
  content_thumbnail_url?: string | null
}

export interface StorySummary {
  enabled: boolean
  total_contents: number
  active_contents: number
  last_publication: string | null
  next_publication: string | null
}

// Payloads de entrada para os services
export interface CreateStoryContentInput {
  company_id: string
  type: StoryContentType
  source: StoryContentSource
  file_url?: string | null
  thumbnail_url?: string | null
  caption?: string | null
  name?: string | null
  folder_id?: string | null
  instagram_media_id?: string | null
  instagram_permalink?: string | null
  created_by?: string | null
}

export interface UpdateStoryContentInput {
  type?: StoryContentType
  caption?: string | null
  name?: string | null
  folder_id?: string | null
  is_active?: boolean
}

export interface UpsertStoryAutomationInput {
  company_id: string
  folder_id: string | null
  instagram_account_id?: string | null
  enabled?: boolean
  publish_mode?: StoryPublishMode
  frequency_type?: StoryFrequencyType
  frequency_value?: number
  weekdays?: number[]
  execution_time?: string
  daily_limit?: number
}

// Representa um post retornado pela Instagram Graph API (estrutura futura)
export interface InstagramMedia {
  id: string
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"
  media_url: string
  thumbnail_url?: string
  permalink: string
  caption?: string
  timestamp: string
}

// Labels para exibição
export const STORY_PUBLISH_MODE_LABELS: Record<StoryPublishMode, string> = {
  random: "Aleatória",
  sequential: "Sequencial",
}

export const STORY_FREQUENCY_LABELS: Record<StoryFrequencyType, string> = {
  daily: "Todos os dias",
  interval: "A cada X dias",
  weekdays: "Dias específicos da semana",
}

export const STORY_STATUS_LABELS: Record<StoryPublicationStatus, string> = {
  scheduled: "Agendado",
  published: "Publicado",
  failed: "Falhou",
}

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

// Labels do agendamento por mídia
export const SCHEDULE_FREQUENCY_LABELS: Record<ScheduleFrequencyType, string> = {
  daily: "Todos os dias",
  interval: "A cada X dias",
  weekdays: "Dias específicos",
}

export const SCHEDULE_MODE_LABELS: Record<ScheduleExecutionMode, string> = {
  sequential: "Sequencial",
  random: "Aleatória",
}

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  scheduled: "Agendado",
  paused: "Pausado",
  published: "Publicado",
  failed: "Falhou",
}

// =====================================================================
// Integração n8n
// =====================================================================

// Linha da view vw_story_pending_publications
export interface StoryPendingPublication {
  automation_id: string
  company_id: string
  folder_id: string | null
  content_id: string
  content_type: StoryContentType
  content_url: string | null
  instagram_media_id: string | null
  source: StoryContentSource
  next_execution: string | null
  publish_mode: StoryPublishMode
  instagram_account_id: string | null
}

// Payload retornado pelo endpoint GET /api/story-automations/pending
export interface StoryPendingItem {
  automation_id: string
  company_id: string
  content_id: string
  content_url: string | null
  instagram_account_id: string | null
  type: StoryContentType
  publish_mode: StoryPublishMode
}

// Payload do endpoint POST /api/story-automations/confirm
export interface StoryConfirmPayload {
  automation_id: string
  content_id: string
  status: "success" | "failed"
  instagram_story_id?: string
  error_message?: string
}

// Métricas da view vw_story_automation_health
export interface StoryAutomationHealth {
  active_automations: number
  published_today: number
  failed_today: number
  upcoming_24h: number
}
