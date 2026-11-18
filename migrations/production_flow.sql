-- Fluxo Cronograma → Produção → Tarefas (Demandas)
-- Rode no SQL do Supabase.

-- 1) Ligações entre conteúdo, roteiro/briefing e tarefa
ALTER TABLE public.video_scripts ADD COLUMN IF NOT EXISTS production_id UUID REFERENCES public.productions(id) ON DELETE SET NULL;
ALTER TABLE public.arte_briefs   ADD COLUMN IF NOT EXISTS production_id UUID REFERENCES public.productions(id) ON DELETE SET NULL;
ALTER TABLE public.demands       ADD COLUMN IF NOT EXISTS production_id UUID REFERENCES public.productions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_demands_production_id ON public.demands(production_id);

-- 2) Novas etapas da Produção: remove a trava antiga de status, se existir
ALTER TABLE public.productions DROP CONSTRAINT IF EXISTS productions_status_check;

-- 3) Converte etapas antigas para as novas
UPDATE public.productions SET status = 'Captação'   WHERE status = 'Produção';
UPDATE public.productions SET status = 'Edição'     WHERE status IN ('Revisão', 'Legenda');
UPDATE public.productions SET status = 'Programado' WHERE status = 'Aprovado';
UPDATE public.productions SET status = 'Publicado'  WHERE status IN ('Em Tráfego', 'Finalizado');
