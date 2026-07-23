-- =====================================================================
-- Stories Automáticos — Correção da EXCLUSÃO (DELETE)
--
-- Sintoma: criar/editar mídias, agendamentos e automações funciona,
-- mas EXCLUIR não persiste — o item "volta" ao recarregar a tela.
--
-- Causa: no Supabase, um DELETE bloqueado por RLS (Row Level Security)
-- NÃO retorna erro; ele apenas remove 0 linhas. Se a tabela tem RLS
-- habilitado com policies de SELECT/INSERT/UPDATE mas SEM policy de
-- DELETE, a exclusão falha silenciosamente.
--
-- Este script:
--   1. Garante os GRANTs de DELETE para os papéis do Supabase.
--   2. Cria policies permissivas de DELETE (quando a tabela usa RLS).
--
-- É idempotente: pode ser rodado novamente sem problemas.
-- Rode UMA vez no SQL Editor do Supabase.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. GRANTs de DELETE (privilégio de tabela)
-- ---------------------------------------------------------------------
GRANT DELETE ON public.story_contents TO anon, authenticated, service_role;
GRANT DELETE ON public.story_automations TO anon, authenticated, service_role;
GRANT DELETE ON public.story_publication_history TO anon, authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'story_folders') THEN
    EXECUTE 'GRANT DELETE ON public.story_folders TO anon, authenticated, service_role';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'story_schedules') THEN
    EXECUTE 'GRANT DELETE ON public.story_schedules TO anon, authenticated, service_role';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. Policies permissivas de DELETE (somente quando RLS está habilitado)
--    Cria uma policy "USING (true)" para DELETE, alinhada ao modelo de
--    acesso atual do projeto (controle feito na aplicação, não via RLS).
--    Se a tabela não usa RLS, a policy é inofensiva.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'story_contents',
    'story_automations',
    'story_publication_history',
    'story_folders',
    'story_schedules'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- só age se a tabela existir
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      -- remove policy anterior (idempotência) e recria
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_delete_all', tbl);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE TO anon, authenticated, service_role USING (true)',
        tbl || '_delete_all',
        tbl
      );
    END IF;
  END LOOP;
END $$;
