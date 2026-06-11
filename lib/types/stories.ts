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
  instagram_media_id: string | null
  instagram_permalink: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface StoryAutomation {
  id: string
  company_id: string
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
  instagram_media_id?: string | null
  instagram_permalink?: string | null
  created_by?: string | null
}

export interface UpdateStoryContentInput {
  type?: StoryContentType
  caption?: string | null
  is_active?: boolean
}

export interface UpsertStoryAutomationInput {
  company_id: string
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
