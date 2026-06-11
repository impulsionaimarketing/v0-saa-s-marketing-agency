-- =====================================================================
-- Stories Automáticos — Camada de Integração com n8n
-- Views, tabela de estado e funções de regra de negócio no banco.
--
-- Pré-requisito: scripts/create-story-automation-tables.sql
-- Reutiliza `clients` como empresa (company_id).
-- Toda a lógica de seleção/agendamento vive no banco para suportar
-- escala (centenas de empresas / milhares de conteúdos).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Conta de Instagram na empresa (clients)
--    O n8n precisa saber qual conta publicar.
-- ---------------------------------------------------------------------
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS instagram_account_id VARCHAR(100);

-- ---------------------------------------------------------------------
-- 2. Estado de execução da sequência (controle anti-repetição)
--    Mantém ponteiro do último conteúdo publicado por automação.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.story_execution_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.story_automations(id) ON DELETE CASCADE,
  last_content_id UUID REFERENCES public.story_contents(id) ON DELETE SET NULL,
  last_position INTEGER DEFAULT 0,
  publications_count INTEGER DEFAULT 0,
  last_execution TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(automation_id)
);

CREATE INDEX IF NOT EXISTS idx_story_exec_state_automation
  ON public.story_execution_state(automation_id);

-- ---------------------------------------------------------------------
-- 3. Função: calcular a próxima execução a partir da configuração
--    Considera frequency_type (daily/interval/weekdays) + execution_time.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.story_compute_next_execution(
  p_frequency_type VARCHAR,
  p_frequency_value INTEGER,
  p_weekdays INTEGER[],
  p_execution_time TIME,
  p_from TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_candidate TIMESTAMPTZ;
  v_base_date DATE := (p_from)::DATE;
  v_i INTEGER;
BEGIN
  -- Ponto de partida: hoje no horário configurado
  v_candidate := (v_base_date + p_execution_time)::TIMESTAMPTZ;

  IF p_frequency_type = 'daily' THEN
    -- Se já passou o horário de hoje, joga para amanhã
    IF v_candidate <= p_from THEN
      v_candidate := v_candidate + INTERVAL '1 day';
    END IF;
    RETURN v_candidate;

  ELSIF p_frequency_type = 'interval' THEN
    -- A cada X dias
    IF v_candidate <= p_from THEN
      v_candidate := v_candidate + (GREATEST(COALESCE(p_frequency_value, 1), 1) || ' days')::INTERVAL;
    END IF;
    RETURN v_candidate;

  ELSIF p_frequency_type = 'weekdays' THEN
    -- Procura o próximo dia da semana habilitado (0=Dom ... 6=Sáb)
    IF p_weekdays IS NULL OR array_length(p_weekdays, 1) IS NULL THEN
      RETURN NULL;
    END IF;
    FOR v_i IN 0..7 LOOP
      v_candidate := ((v_base_date + v_i) + p_execution_time)::TIMESTAMPTZ;
      IF EXTRACT(DOW FROM v_candidate)::INTEGER = ANY(p_weekdays)
         AND v_candidate > p_from THEN
        RETURN v_candidate;
      END IF;
    END LOOP;
    RETURN NULL;
  END IF;

  RETURN v_candidate;
END;
$$;

-- ---------------------------------------------------------------------
-- 4. View: fila de automações ativas (agenda)
--    Usada pelo n8n para saber o que está agendado e quando roda.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_story_automation_queue AS
SELECT
  a.id                       AS automation_id,
  a.company_id               AS company_id,
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
-- 5. View: publicações pendentes (conteúdo apto a publicar agora)
--    Aplica regras:
--      - automação ativa
--      - empresa com instagram conectado
--      - next_execution <= now()
--      - respeita daily_limit (não passou do limite de hoje)
--      - escolhe o conteúdo conforme publish_mode
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
-- quantas publicações com sucesso já saíram hoje (para o daily_limit)
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
-- seleciona um conteúdo apto por automação conforme o modo
ranked AS (
  SELECT
    d.id            AS automation_id,
    d.company_id    AS company_id,
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
        -- sequencial: próximo conteúdo após o último publicado (por created_at)
        CASE WHEN d.publish_mode = 'sequential' THEN
          CASE
            WHEN es.last_content_id IS NULL THEN 0
            WHEN sc.created_at > (
              SELECT created_at FROM public.story_contents WHERE id = es.last_content_id
            ) THEN 0
            ELSE 1
          END
        END ASC,
        -- aleatório: ordem randômica; sequencial: por data de criação
        CASE WHEN d.publish_mode = 'random' THEN random() ELSE NULL END ASC,
        sc.created_at ASC
    ) AS rn
  FROM due d
  LEFT JOIN public.story_execution_state es ON es.automation_id = d.id
  JOIN public.story_contents sc
    ON sc.company_id = d.company_id
   AND sc.is_active = TRUE
   AND sc.file_url IS NOT NULL
)
SELECT
  automation_id,
  company_id,
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
-- 6. Função: confirmar publicação (chamada pelo endpoint /confirm)
--    Atualiza histórico, estado da sequência e próxima execução,
--    de forma atômica. Registra falhas quando status = 'failed'.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.story_confirm_publication(
  p_automation_id UUID,
  p_content_id UUID,
  p_status VARCHAR,
  p_instagram_story_id VARCHAR DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS public.story_publication_history
LANGUAGE plpgsql
AS $$
DECLARE
  v_automation public.story_automations%ROWTYPE;
  v_position INTEGER;
  v_history public.story_publication_history%ROWTYPE;
  v_next TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_automation FROM public.story_automations WHERE id = p_automation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Automação % não encontrada', p_automation_id;
  END IF;

  -- Registra no histórico
  INSERT INTO public.story_publication_history (
    automation_id, company_id, content_id,
    scheduled_for, published_at, status,
    instagram_story_id, error_message
  ) VALUES (
    p_automation_id,
    v_automation.company_id,
    p_content_id,
    v_automation.next_execution,
    CASE WHEN p_status = 'success' OR p_status = 'published' THEN NOW() ELSE NULL END,
    CASE WHEN p_status = 'success' THEN 'published' ELSE p_status END,
    p_instagram_story_id,
    p_error_message
  )
  RETURNING * INTO v_history;

  -- Calcula a próxima execução com base na configuração
  v_next := public.story_compute_next_execution(
    v_automation.frequency_type,
    v_automation.frequency_value,
    v_automation.weekdays,
    v_automation.execution_time,
    NOW()
  );

  -- Atualiza a automação (último/próximo)
  UPDATE public.story_automations
  SET last_execution = NOW(),
      next_execution = v_next,
      last_content_id = CASE
        WHEN p_status IN ('success', 'published') THEN p_content_id
        ELSE last_content_id
      END,
      updated_at = NOW()
  WHERE id = p_automation_id;

  -- Atualiza o estado da sequência (apenas em sucesso)
  IF p_status IN ('success', 'published') THEN
    SELECT COALESCE(last_position, 0) INTO v_position
    FROM public.story_execution_state WHERE automation_id = p_automation_id;

    INSERT INTO public.story_execution_state (
      automation_id, last_content_id, last_position, publications_count, last_execution, updated_at
    ) VALUES (
      p_automation_id, p_content_id, COALESCE(v_position, 0) + 1, 1, NOW(), NOW()
    )
    ON CONFLICT (automation_id) DO UPDATE
      SET last_content_id = EXCLUDED.last_content_id,
          last_position = public.story_execution_state.last_position + 1,
          publications_count = public.story_execution_state.publications_count + 1,
          last_execution = NOW(),
          updated_at = NOW();
  END IF;

  RETURN v_history;
END;
$$;

-- ---------------------------------------------------------------------
-- 7. View: saúde da automação (dashboard)
--    Métricas agregadas para a tela.
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
