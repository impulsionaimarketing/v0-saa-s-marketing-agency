-- =====================================================================
-- Stories Automáticos — Correção de permissões (GRANTs)
--
-- As tabelas/views novas precisam dos mesmos GRANTs que as demais
-- tabelas do projeto para os papéis usados pelo Supabase
-- (anon = chave pública, authenticated = usuário logado, service_role).
--
-- Sem isso o app recebe: 42501 "permission denied for table ..."
--
-- Rode este script UMA vez após criar as tabelas/views.
-- É idempotente: pode ser executado novamente sem problemas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_contents TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_automations TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_publication_history TO anon, authenticated, service_role;

-- Tabela de estado da integração n8n (pode ainda não existir se o
-- script de integração não tiver sido rodado — protegido por DO block)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'story_execution_state'
  ) THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_execution_state TO anon, authenticated, service_role';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- Views (somente leitura)
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'vw_story_automation_queue') THEN
    EXECUTE 'GRANT SELECT ON public.vw_story_automation_queue TO anon, authenticated, service_role';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'vw_story_pending_publications') THEN
    EXECUTE 'GRANT SELECT ON public.vw_story_pending_publications TO anon, authenticated, service_role';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'vw_story_automation_health') THEN
    EXECUTE 'GRANT SELECT ON public.vw_story_automation_health TO anon, authenticated, service_role';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- Funções (executadas pelos endpoints / n8n)
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'story_compute_next_execution') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.story_compute_next_execution TO anon, authenticated, service_role';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'story_confirm_publication') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.story_confirm_publication TO anon, authenticated, service_role';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- Garantir acesso às sequences (caso alguma coluna use serial/identity).
-- As PKs aqui são UUID, então normalmente não é necessário, mas é seguro.
-- ---------------------------------------------------------------------
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
