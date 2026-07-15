-- =====================================================================
-- Stories Automáticos — Evolução: Automação por Pasta
--
-- Pré-requisitos:
--   - scripts/create-story-automation-tables.sql
--   - scripts/create-story-n8n-integration.sql
--   - scripts/create-story-folders-schedules.sql  (story_folders + story_contents.folder_id)
--
-- Objetivo: cada PASTA passa a ter sua própria configuração de automação
-- em `story_automations` (agora com `folder_id`). As views de fila/pendências
-- passam a respeitar a pasta, publicando apenas conteúdos da pasta da automação.
--
-- Script idempotente — pode ser executado mais de uma vez com segurança.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Vincular automação a uma pasta
-- ---------------------------------------------------------------------
ALTER TABLE public.story_automations
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.story_folders(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------
-- 2. Trocar a unicidade: antes era UNIQUE(company_id); agora por (company_id, folder_id)
-- ---------------------------------------------------------------------
ALTER TABLE public.story_automations
  DROP CONSTRAINT IF EXISTS story_automations_company_id_key;

-- Uma automação por pasta dentro da empresa. Índice de colunas simples
-- (não por expressão) para que o upsert ON CONFLICT (company_id, folder_id) funcione.
CREATE UNIQUE INDEX IF NOT EXISTS uq_story_automations_company_folder
  ON public.story_automations(company_id, folder_id);

CREATE INDEX IF NOT EXISTS idx_story_automations_folder
  ON public.story_automations(folder_id);

-- ---------------------------------------------------------------------
-- 3. View de fila: expor folder_id (para depuração / n8n)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_story_automation_queue AS
SELECT
  a.id                       AS automation_id,
  a.company_id               AS company_id,
  a.folder_id                AS folder_id,
  c.name                     AS company_name,
  c.instagram_account_id     AS instagram_account_id,
  a.enabled                  AS enabled,
  a.publish_mode             AS publish_mode,
  a.frequency_type           AS frequency_type,
  a.frequency_value          AS frequency_value,
  a.execution_time           AS execution_time,
  COALESCE(
    a.next_execution,
    public.story_compute_next_execution(
      a.frequency_type, a.frequency_value, a.weekdays, a.execution_time, NOW()
    )
  )                          AS next_execution,
  a.daily_limit              AS daily_limit
FROM public.story_automations a
JOIN public.clients c ON c.id = a.company_id
WHERE a.enabled = TRUE;

-- ---------------------------------------------------------------------
-- 4. View de pendências: cada automação só seleciona conteúdos da SUA pasta
--    (sc.folder_id IS NOT DISTINCT FROM a.folder_id)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_story_pending_publications AS
WITH active AS (
  SELECT
    a.*,
    c.instagram_account_id,
    COALESCE(
      a.next_execution,
      public.story_compute_next_execution(
        a.frequency_type, a.frequency_value, a.weekdays, a.execution_time, NOW()
      )
    ) AS computed_next
  FROM public.story_automations a
  JOIN public.clients c ON c.id = a.company_id
  WHERE a.enabled = TRUE
    AND c.instagram_account_id IS NOT NULL
),
today_counts AS (
  SELECT automation_id, COUNT(*) AS published_today
  FROM public.story_publication_history
  WHERE status = 'published'
    AND published_at >= date_trunc('day', NOW())
  GROUP BY automation_id
),
due AS (
  SELECT a.*
  FROM active a
  LEFT JOIN today_counts t ON t.automation_id = a.id
  WHERE a.computed_next <= NOW()
    AND COALESCE(t.published_today, 0) < COALESCE(a.daily_limit, 1)
),
ranked AS (
  SELECT
    d.id            AS automation_id,
    d.company_id    AS company_id,
    d.folder_id     AS folder_id,
    d.instagram_account_id,
    d.publish_mode,
    d.computed_next AS next_execution,
    sc.id           AS content_id,
    sc.type         AS content_type,
    sc.file_url     AS content_url,
    sc.instagram_media_id,
    sc.source,
    sc.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY d.id
      ORDER BY
        CASE WHEN d.publish_mode = 'sequential' THEN
          CASE
            WHEN es.last_content_id IS NULL THEN 0
            WHEN sc.created_at > (
              SELECT created_at FROM public.story_contents WHERE id = es.last_content_id
            ) THEN 0
            ELSE 1
          END
        END ASC,
        CASE WHEN d.publish_mode = 'random' THEN random() ELSE NULL END ASC,
        sc.created_at ASC
    ) AS rn
  FROM due d
  LEFT JOIN public.story_execution_state es ON es.automation_id = d.id
  JOIN public.story_contents sc
    ON sc.company_id = d.company_id
   AND sc.is_active = TRUE
   AND sc.file_url IS NOT NULL
   -- >>> respeita a pasta da automação <<<
   AND sc.folder_id IS NOT DISTINCT FROM d.folder_id
)
SELECT
  automation_id,
  company_id,
  folder_id,
  content_id,
  content_type,
  content_url,
  instagram_media_id,
  source,
  next_execution,
  publish_mode,
  instagram_account_id
FROM ranked
WHERE rn = 1;

-- ---------------------------------------------------------------------
-- 5. vw_story_automation_health permanece válida (conta automações habilitadas,
--    agora possivelmente várias por empresa) — nada a alterar.
-- ---------------------------------------------------------------------
