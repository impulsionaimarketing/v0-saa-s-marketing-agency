-- Tráfego pago: Meta Ads + Google Ads numa tabela única (base dos relatórios)
-- Rode no SQL do Supabase.

-- 1) Uma linha por dia × plataforma × conta × anúncio
CREATE TABLE IF NOT EXISTS public.ads_insights_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT,
  account_id TEXT NOT NULL,
  report_date DATE NOT NULL,

  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  campaign_objective TEXT,          -- Meta: objetivo | Google: tipo de canal (SEARCH, PMAX...)
  campaign_status TEXT,
  adset_id TEXT NOT NULL DEFAULT '',   -- Meta: conjunto | Google: grupo de anúncios
  adset_name TEXT,
  ad_id TEXT NOT NULL,
  ad_name TEXT,

  impressions BIGINT NOT NULL DEFAULT 0,
  reach BIGINT,                      -- Google não informa alcance por anúncio
  clicks BIGINT NOT NULL DEFAULT 0,
  link_clicks BIGINT,
  spend NUMERIC(12, 2) NOT NULL DEFAULT 0,
  frequency NUMERIC(8, 2),

  results NUMERIC(14, 2) NOT NULL DEFAULT 0,   -- depende do tipo de campanha do cliente
  result_type TEXT,                            -- 'conversas', 'compras', 'leads', 'alcance', 'conversoes'
  conversion_value NUMERIC(14, 2) NOT NULL DEFAULT 0,  -- faturamento atribuído (vendas)

  raw JSONB,                                   -- dados brutos da plataforma (actions etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE (platform, account_id, report_date, ad_id)
);

CREATE INDEX IF NOT EXISTS idx_ads_daily_client_date ON public.ads_insights_daily (client_id, report_date);
CREATE INDEX IF NOT EXISTS idx_ads_daily_platform_date ON public.ads_insights_daily (platform, report_date);
CREATE INDEX IF NOT EXISTS idx_ads_daily_campaign ON public.ads_insights_daily (campaign_id, report_date);

-- 2) Log das atualizações (a aba mostra "atualizado há X horas" e erros)
CREATE TABLE IF NOT EXISTS public.ads_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  platform TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT,
  account_id TEXT,
  date_from DATE,
  date_to DATE,
  status TEXT NOT NULL CHECK (status IN ('ok', 'erro')),
  rows_count INTEGER DEFAULT 0,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_ads_sync_runs_started ON public.ads_sync_runs (started_at DESC);

-- 3) Visões prontas para dashboard e relatórios
CREATE OR REPLACE VIEW public.ads_client_daily AS
SELECT
  platform, client_id, client_name, report_date,
  SUM(spend) AS spend,
  SUM(impressions) AS impressions,
  SUM(clicks) AS clicks,
  SUM(link_clicks) AS link_clicks,
  SUM(results) AS results,
  SUM(conversion_value) AS conversion_value
FROM public.ads_insights_daily
GROUP BY platform, client_id, client_name, report_date;

CREATE OR REPLACE VIEW public.ads_campaign_daily AS
SELECT
  platform, client_id, client_name, report_date,
  campaign_id, MAX(campaign_name) AS campaign_name,
  MAX(campaign_objective) AS campaign_objective,
  MAX(campaign_status) AS campaign_status,
  SUM(spend) AS spend,
  SUM(impressions) AS impressions,
  SUM(reach) AS reach,
  SUM(clicks) AS clicks,
  SUM(link_clicks) AS link_clicks,
  SUM(results) AS results,
  SUM(conversion_value) AS conversion_value
FROM public.ads_insights_daily
GROUP BY platform, client_id, client_name, report_date, campaign_id;

-- 4) Histórico do Meta que já existia (sem resultados, só métricas básicas)
--    No banco antigo o client_id era texto: liga ao cliente pelo id ou, se não achar, pelo nome.
--    Linhas sem cliente correspondente entram com client_id vazio (não somem do histórico).
INSERT INTO public.ads_insights_daily (
  platform, client_id, client_name, account_id, report_date,
  campaign_id, campaign_name, campaign_objective, campaign_status,
  adset_id, adset_name, ad_id, ad_name,
  impressions, reach, clicks, spend, frequency
)
SELECT
  'meta',
  (SELECT c.id FROM public.clients c
    WHERE c.id::text = m.client_id::text
       OR lower(c.name) = lower(m.client_name::text)
    ORDER BY (c.id::text = m.client_id::text) DESC
    LIMIT 1),
  m.client_name::text,
  m.ad_account_id::text,
  m.report_date::date,
  m.campaign_id::text, m.campaign_name::text, m.campaign_objective::text, m.campaign_status::text,
  COALESCE(m.adset_id::text, ''), m.adset_name::text, m.ad_id::text, m.ad_name::text,
  COALESCE(m.impressions, 0)::bigint, m.reach::bigint, COALESCE(m.clicks, 0)::bigint,
  COALESCE(m.spend, 0)::numeric, m.frequency::numeric
FROM public.meta_ads_insights_full m
WHERE m.ad_id IS NOT NULL AND m.campaign_id IS NOT NULL AND m.ad_account_id IS NOT NULL AND m.report_date IS NOT NULL
ON CONFLICT (platform, account_id, report_date, ad_id) DO NOTHING;

-- 5) Permissões (papéis usados pelo app e pelo n8n)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ads_insights_daily TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ads_sync_runs TO anon, authenticated, service_role;
GRANT SELECT ON public.ads_client_daily, public.ads_campaign_daily TO anon, authenticated, service_role;
ALTER TABLE public.ads_insights_daily DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_sync_runs DISABLE ROW LEVEL SECURITY;
