-- Relatórios de tráfego por cliente (gerados a partir de ads_insights_daily)
-- Rode no SQL do Supabase (depois de ads_insights.sql).
CREATE TABLE IF NOT EXISTS public.client_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'visualizado')),
  token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  snapshot JSONB NOT NULL,                  -- números congelados no momento da geração
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_client_reports_client ON public.client_reports (client_id, period_start DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.client_reports TO anon, authenticated, service_role;
ALTER TABLE public.client_reports DISABLE ROW LEVEL SECURITY;
