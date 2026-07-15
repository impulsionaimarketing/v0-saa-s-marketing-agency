-- ============================================================================
-- Aprovação por elemento (capa / mídia / legenda) + capa do reels
-- ============================================================================
-- COMO USAR: rode este script inteiro no SQL Editor do Supabase.
--
-- 1. Adiciona a coluna `cover_url` em productions para guardar a capa do reels
--    (usada apenas quando o tipo é "Vídeo").
-- 2. Adiciona a coluna `element` em production_approvals para permitir uma
--    decisão independente por elemento: 'capa', 'midia' ou 'legenda'.
--    Registros antigos (element = NULL) continuam representando a produção inteira.
-- ============================================================================

ALTER TABLE public.productions
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

ALTER TABLE public.production_approvals
  ADD COLUMN IF NOT EXISTS element TEXT;

-- (Opcional) índice para consultar decisões por elemento mais rápido
CREATE INDEX IF NOT EXISTS idx_production_approvals_element
  ON public.production_approvals(production_id, element);
