-- =====================================================================
-- Stories Automáticos — Evolução: escolha da conta de Instagram por automação
--
-- Pré-requisitos:
--   - scripts/create-story-automation-tables.sql
--   - scripts/create-story-n8n-integration.sql
--   - scripts/evolve-story-automation-by-folder.sql
--
-- Contexto: o cliente agora pode ter VÁRIAS contas de Instagram, guardadas
-- em `clients.instagram_accounts` (JSONB, array de { username, account_id }).
-- Cada automação (por pasta) passa a escolher em qual conta publicar.
--
-- Regra de resolução da conta efetiva usada pelo n8n:
--   1) a conta escolhida na automação (story_automations.instagram_account_id)
--   2) senão, a primeira conta do array do cliente (fallback retrocompatível)
--
-- Script idempotente — pode ser executado mais de uma vez com segurança.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Garantir a coluna JSONB de contas no cliente (múltiplos Instagram)
-- ---------------------------------------------------------------------
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS instagram_accounts JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Migração suave: se ainda houver o antigo instagram_account_id preenchido
-- e o array estiver vazio, converte para o novo formato.
UPDATE public.clients
SET instagram_accounts = jsonb_build_array(
      jsonb_build_object(
        'username', COALESCE(instagram_username, ''),
        'account_id', instagram_account_id
      )
    )
WHERE instagram_account_id IS NOT NULL
  AND (instagram_accounts IS NULL OR instagram_accounts = '[]'::jsonb);

-- ---------------------------------------------------------------------
-- 1. Conta escolhida por automação
-- ---------------------------------------------------------------------
ALTER TABLE public.story_automations
  ADD COLUMN IF NOT EXISTS instagram_account_id VARCHAR(100);

-- ---------------------------------------------------------------------
-- 2. View de fila: expor a conta EFETIVA (escolhida ou primeira do array)
--    (health depende dela — recriada no passo 4)
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS public.vw_story_automation_health;
DROP VIEW IF EXISTS public.vw_story_automation_queue;
CREATE VIEW public.vw_story_automation_queue AS
SELECT
  a.id                       AS automation_id,
  a.company_id               AS company_id,
  a.folder_id                AS folder_id,
  c.name                     AS company_name,
  COALESCE(
    a.instagram_account_id,
    c.instagram_accounts -> 0 ->> 'account_id'
  )                          AS instagram_account_id,
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
-- 3. View de pendências: usa a conta efetiva e exige que ela exista
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS public.vw_story_pending_publications;
CREATE VIEW public.vw_story_pending_publications AS
WITH active AS (
  SELECT
    a.*,
    -- conta efetiva: a escolhida na automação, senão a primeira do cliente
    COALESCE(
      a.instagram_account_id,
      c.instagram_accounts -> 0 ->> 'account_id'
    ) AS effective_instagram_account_id,
    COALESCE(
      a.next_execution,
      public.story_compute_next_execution(
        a.frequency_type, a.frequency_value, a.weekdays, a.execution_time, NOW()
      )
    ) AS computed_next
  FROM public.story_automations a
  JOIN public.clients c ON c.id = a.company_id
  WHERE a.enabled = TRUE
    AND COALESCE(
          a.instagram_account_id,
          c.instagram_accounts -> 0 ->> 'account_id'
        ) IS NOT NULL
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
    d.id                              AS automation_id,
    d.company_id                      AS company_id,
    d.folder_id                       AS folder_id,
    d.effective_instagram_account_id  AS instagram_account_id,
    d.publish_mode,
    d.computed_next                   AS next_execution,
    sc.id                             AS content_id,
    sc.type                           AS content_type,
    sc.file_url                       AS content_url,
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
   -- respeita a pasta da automação
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
-- 4. Recriar vw_story_automation_health (removida no passo 2 por depender
--    da fila). Definição idêntica à original.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_story_automation_health AS
SELECT
  (SELECT COUNT(*) FROM public.story_automations WHERE enabled = TRUE) AS active_automations,
  (SELECT COUNT(*) FROM public.story_publication_history
     WHERE status = 'published' AND published_at >= date_trunc('day', NOW())) AS published_today,
  (SELECT COUNT(*) FROM public.story_publication_history
     WHERE status = 'failed' AND created_at >= date_trunc('day', NOW())) AS failed_today,
  (SELECT COUNT(*) FROM public.vw_story_automation_queue
     WHERE next_execution <= NOW() + INTERVAL '24 hours') AS upcoming_24h;
