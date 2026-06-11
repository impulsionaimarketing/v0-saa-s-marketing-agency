-- =====================================================================
-- Stories Automáticos
-- Estrutura de banco preparada para integração futura com
-- Supabase, n8n e Instagram Graph API.
--
-- Reutiliza a tabela existente `clients` como "empresa" (company_id).
-- Reutiliza `users` para auditoria de criação.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Conteúdos disponíveis para publicação nos stories
-- Origem: upload (Vercel Blob) ou Instagram (post já publicado)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.story_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  source VARCHAR(20) NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'instagram')),
  file_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  instagram_media_id VARCHAR(100),
  -- guarda o permalink / dados crus retornados pela Graph API (futuro)
  instagram_permalink TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Configuração da automação por empresa
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.story_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  -- aleatória ou sequencial
  publish_mode VARCHAR(20) NOT NULL DEFAULT 'random' CHECK (publish_mode IN ('random', 'sequential')),
  -- daily = todos os dias | interval = a cada X dias | weekdays = dias específicos
  frequency_type VARCHAR(20) NOT NULL DEFAULT 'daily' CHECK (frequency_type IN ('daily', 'interval', 'weekdays')),
  -- usado quando frequency_type = 'interval' (a cada X dias)
  frequency_value INTEGER DEFAULT 1,
  -- usado quando frequency_type = 'weekdays' (0=Dom ... 6=Sáb)
  weekdays INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  -- horário de execução
  execution_time TIME DEFAULT '08:00',
  -- quantidade máxima de stories por dia
  daily_limit INTEGER DEFAULT 1,
  -- controle de execução (preenchido pelo n8n futuramente)
  last_execution TIMESTAMPTZ,
  next_execution TIMESTAMPTZ,
  -- ponteiro para o modo sequencial
  last_content_id UUID REFERENCES public.story_contents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- ---------------------------------------------------------------------
-- Histórico de publicações realizadas
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.story_publication_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES public.story_automations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.story_contents(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed')),
  instagram_story_id VARCHAR(100),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_story_contents_company ON public.story_contents(company_id);
CREATE INDEX IF NOT EXISTS idx_story_contents_source ON public.story_contents(source);
CREATE INDEX IF NOT EXISTS idx_story_automations_company ON public.story_automations(company_id);
CREATE INDEX IF NOT EXISTS idx_story_automations_enabled ON public.story_automations(enabled);
CREATE INDEX IF NOT EXISTS idx_story_automations_next_exec ON public.story_automations(next_execution);
CREATE INDEX IF NOT EXISTS idx_story_history_automation ON public.story_publication_history(automation_id);
CREATE INDEX IF NOT EXISTS idx_story_history_company ON public.story_publication_history(company_id);
CREATE INDEX IF NOT EXISTS idx_story_history_status ON public.story_publication_history(status);

-- ---------------------------------------------------------------------
-- Registrar o módulo de acesso (mesmo padrão dos demais módulos)
-- ---------------------------------------------------------------------
UPDATE public.users
SET modules_access = array_append(modules_access, 'stories_automaticos')
WHERE NOT ('stories_automaticos' = ANY(modules_access));
