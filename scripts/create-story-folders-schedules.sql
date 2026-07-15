-- =====================================================================
-- Stories Automáticos — Pastas + Agendamento por mídia
-- Evolução da tela para um gerenciador estilo Google Drive.
--
-- Pré-requisito: scripts/create-story-automation-tables.sql
--
-- IMPORTANTE:
--   - As tabelas existentes (story_contents, story_automations,
--     story_publication_history) permanecem intactas.
--   - Este script apenas ADICIONA a coluna folder_id em story_contents
--     e cria as tabelas story_folders e story_schedules.
--   - Rode este script manualmente no Supabase quando desejar.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Pastas (organização estilo Drive)
--    Cada pasta pertence a uma empresa (clients).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.story_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_folders_company ON public.story_folders(company_id);

-- ---------------------------------------------------------------------
-- 2. Vincula conteúdos a pastas
--    ON DELETE SET NULL: excluir a pasta NUNCA apaga a mídia; ela apenas
--    volta a ficar "Sem pasta".
--    Também adiciona um nome amigável opcional para exibição no card.
-- ---------------------------------------------------------------------
ALTER TABLE public.story_contents
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.story_folders(id) ON DELETE SET NULL;

ALTER TABLE public.story_contents
  ADD COLUMN IF NOT EXISTS name TEXT;

CREATE INDEX IF NOT EXISTS idx_story_contents_folder ON public.story_contents(folder_id);

-- ---------------------------------------------------------------------
-- 3. Agendamento individual por mídia
--    Substitui o modelo de automação global. Cada mídia pode ter 1
--    agendamento ativo. O n8n (futuro) lê next_execution para publicar.
--    frequency_type:
--      daily     = todos os dias
--      interval  = a cada X dias (interval_days)
--      weekdays  = dias específicos da semana (weekdays: 0=Dom ... 6=Sáb)
--    execution_mode:
--      sequential = segue a ordem das mídias da pasta/seleção
--      random     = ordem aleatória
--    status:
--      scheduled | paused | published | failed
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.story_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.story_contents(id) ON DELETE CASCADE,
  frequency_type VARCHAR(20) NOT NULL DEFAULT 'daily'
    CHECK (frequency_type IN ('daily', 'interval', 'weekdays')),
  interval_days INTEGER DEFAULT 1,
  weekdays INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  execution_time TIME NOT NULL DEFAULT '08:00',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  total_weeks INTEGER,
  execution_mode VARCHAR(20) NOT NULL DEFAULT 'sequential'
    CHECK (execution_mode IN ('sequential', 'random')),
  next_execution TIMESTAMPTZ,
  last_execution TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'paused', 'published', 'failed')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garante no máximo 1 agendamento ATIVO por mídia (permite histórico de pausados/publicados)
CREATE UNIQUE INDEX IF NOT EXISTS uq_story_schedules_active_content
  ON public.story_schedules(content_id)
  WHERE status IN ('scheduled', 'paused');

CREATE INDEX IF NOT EXISTS idx_story_schedules_company ON public.story_schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_story_schedules_content ON public.story_schedules(content_id);
CREATE INDEX IF NOT EXISTS idx_story_schedules_next_exec ON public.story_schedules(next_execution);
CREATE INDEX IF NOT EXISTS idx_story_schedules_status ON public.story_schedules(status);

-- ---------------------------------------------------------------------
-- 4. Gatilho para manter updated_at atualizado
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_story_folders_updated_at ON public.story_folders;
CREATE TRIGGER trg_story_folders_updated_at
  BEFORE UPDATE ON public.story_folders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_story_schedules_updated_at ON public.story_schedules;
CREATE TRIGGER trg_story_schedules_updated_at
  BEFORE UPDATE ON public.story_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
